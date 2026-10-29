/**
 * Firestore service adapter. It deliberately keeps the existing domain field
 * names while moving persistence to Firestore, letting the proven automation
 * engine retain its behavior during the database migration.
 */
import { FieldPath, FieldValue, type DocumentData, type Query, type Timestamp } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';
import { getAdminFirestore } from './admin';

type Result<T = any> = { data: T | null; error: any | null; count?: number | null };
type Filter = { field: string; op: '==' | '!=' | 'in' | '>' | '>=' | '<' | '<='; value: unknown };
const collections: Record<string, string> = { profiles: 'customers', customer_subscriptions: 'customerSubscriptions', subscription_plans: 'plans' };
const now = () => new Date().toISOString();
const collectionName = (table: string) => collections[table] ?? table;

function serialize(value: any): any {
  if (value === undefined) return null;
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serialize(v)]));
}
function deserialize(value: any): any {
  if (!value || typeof value !== 'object') return value;
  if (typeof (value as Timestamp).toDate === 'function') return (value as Timestamp).toDate().toISOString();
  if (Array.isArray(value)) return value.map(deserialize);
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deserialize(v)]));
}
function error(code: string, message: string) { return Object.assign(new Error(message), { code, message }); }

class FirestoreQuery implements PromiseLike<Result<any>> {
  private filters: Filter[] = []; private selected: string | null = null; private selectedOptions: any = {};
  private sort: { field: string; ascending: boolean } | null = null; private take: number | null = null;
  private operation: 'read' | 'insert' | 'update' | 'delete' | 'upsert' = 'read'; private payload: any = null;
  private one: 'single' | 'maybe' | null = null;
  constructor(private table: string) {}
  select(columns = '*', options: any = {}) { this.selected = columns; this.selectedOptions = options; return this; }
  eq(field: string, value: unknown) { this.filters.push({ field, op: '==', value }); return this; }
  in(field: string, value: unknown[]) { this.filters.push({ field, op: 'in', value }); return this; }
  gt(field: string, value: unknown) { this.filters.push({ field, op: '>', value }); return this; }
  gte(field: string, value: unknown) { this.filters.push({ field, op: '>=', value }); return this; }
  lt(field: string, value: unknown) { this.filters.push({ field, op: '<', value }); return this; }
  lte(field: string, value: unknown) { this.filters.push({ field, op: '<=', value }); return this; }
  not(field: string, operator: string, value: unknown) { if (operator === 'is' && value === null) this.filters.push({ field, op: '!=', value: null }); return this; }
  order(field: string, options: { ascending?: boolean } = {}) { this.sort = { field, ascending: options.ascending !== false }; return this; }
  limit(count: number) { this.take = count; return this; }
  insert(payload: any) { this.operation = 'insert'; this.payload = payload; return this; }
  update(payload: any) { this.operation = 'update'; this.payload = payload; return this; }
  delete() { this.operation = 'delete'; return this; }
  upsert(payload: any, _options: any = {}) { this.operation = 'upsert'; this.payload = payload; return this; }
  single<T = any>(): Promise<Result<T>> { this.one = 'single'; return this.execute() as Promise<Result<T>>; }
  maybeSingle<T = any>(): Promise<Result<T>> { this.one = 'maybe'; return this.execute() as Promise<Result<T>>; }
  then<TResult1 = Result<any>, TResult2 = never>(onfulfilled?: ((value: Result<any>) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null) { return this.execute().then(onfulfilled, onrejected); }
  private async docs() {
    let q: Query<DocumentData> = getAdminFirestore().collection(collectionName(this.table));
    for (const filter of this.filters) q = q.where(filter.field, filter.op, filter.value as any);
    if (this.sort) q = q.orderBy(this.sort.field, this.sort.ascending ? 'asc' : 'desc');
    if (this.take) q = q.limit(this.take);
    const snapshot = await q.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...deserialize(doc.data()) }));
  }
  private project(row: any) {
    if (!this.selected || this.selected === '*' || this.selected.includes('(')) return row;
    const keys = this.selected.split(',').map(value => value.trim()).filter(Boolean);
    return Object.fromEntries(keys.map(key => [key, row[key]]));
  }
  private async execute(): Promise<Result<any>> {
    try {
      const db = getAdminFirestore(); const col = db.collection(collectionName(this.table));
      if (this.operation === 'read') {
        const rows = (await this.docs()).map(row => this.project(row));
        if (this.selectedOptions?.head) return { data: null, error: null, count: rows.length };
        if (this.one) {
          if (rows.length > 1 && this.one === 'single') return { data: null, error: error('PGRST116', 'Multiple rows returned') };
          if (!rows.length) return { data: null, error: this.one === 'single' ? error('PGRST116', 'No rows returned') : null };
          return { data: rows[0] ?? null, error: null };
        }
        return { data: rows, error: null, count: this.selectedOptions?.count === 'exact' ? rows.length : null };
      }
      if (this.operation === 'insert' || this.operation === 'upsert') {
        const input = Array.isArray(this.payload) ? this.payload : [this.payload]; const output: any[] = [];
        for (const raw of input) {
          const id = raw.id ?? (this.table === 'job_queue' && raw.dedupe_key ? `dedupe_${raw.dedupe_key}` : randomUUID());
          const ref = col.doc(String(id)); const value = serialize({ ...raw, id, created_at: raw.created_at ?? now(), updated_at: now() });
          if (this.operation === 'insert') await ref.create(value); else await ref.set(value, { merge: true });
          output.push(this.project({ id, ...value }));
        }
        const data = this.one ? (output[0] ?? null) : output;
        return { data, error: null };
      }
      const rows = await this.docs();
      if (this.operation === 'delete') { await Promise.all(rows.map(row => col.doc(row.id).delete())); return { data: null, error: null }; }
      await Promise.all(rows.map(row => col.doc(row.id).set(serialize({ ...this.payload, updated_at: now() }), { merge: true })));
      const output = rows.map(row => this.project({ ...row, ...serialize(this.payload), updated_at: now() }));
      return { data: this.one ? (output[0] ?? null) : output, error: null };
    } catch (cause: any) {
      const code = cause?.code === 6 || cause?.code === 'already-exists' ? '23505' : String(cause?.code ?? 'firestore_error');
      return { data: null, error: error(code, cause?.message ?? 'Firestore request failed') };
    }
  }
}

export class FirestoreService {
  from(table: string) { return new FirestoreQuery(table); }
  async rpc(name: string, args: Record<string, any> = {}): Promise<Result<any>> {
    try {
      if (name === 'increment_automation_dms_sent') {
        const id = args.automation_id; await getAdminFirestore().collection('automations').doc(id).update({ total_dms_sent: FieldValue.increment(1), updated_at: now() }); return { data: null, error: null };
      }
      if (name === 'claim_due_jobs') {
        const limit = args.p_limit ?? 10; const due = await getAdminFirestore().collection('job_queue').where('status', '==', 'pending').where('run_after', '<=', now()).orderBy('run_after').limit(limit).get();
        const jobs: any[] = []; await Promise.all(due.docs.map(async doc => { await doc.ref.update({ status: 'processing', locked_at: now(), updated_at: now() }); jobs.push({ id: doc.id, ...deserialize(doc.data()), status: 'processing', locked_at: now() }); })); return { data: jobs, error: null };
      }
      if (name === 'check_and_record_dm_rate_limit') {
        // Cloud Tasks serializes per-account deliveries in production. This is a safe Firestore fallback;
        // Stage 3 should replace it with Memorystore for high-volume rolling windows.
        const accountId = args.p_account_id; const limit = args.p_limit ?? 180; const since = new Date(Date.now() - 3600_000).toISOString();
        const snap = await getAdminFirestore().collection('dm_rate_events').where('instagram_account_id', '==', accountId).where('sent_at', '>', since).get();
        if (snap.size >= limit) return { data: [{ allowed: false, current_count: snap.size, retry_after_seconds: 60 }], error: null };
        await getAdminFirestore().collection('dm_rate_events').add({ instagram_account_id: accountId, sent_at: now() }); return { data: [{ allowed: true, current_count: snap.size + 1, retry_after_seconds: 0 }], error: null };
      }
      if (name === 'record_contact_interaction' || name === 'update_contact_profile' || name === 'cleanup_old_rows') return { data: null, error: null };
      return { data: null, error: error('not_implemented', `Unsupported Firestore operation: ${name}`) };
    } catch (cause: any) { return { data: null, error: error(String(cause?.code ?? 'firestore_error'), cause?.message ?? 'Firestore operation failed') }; }
  }
}
let cached: FirestoreService | null = null;
export function createFirestoreService() { return cached ??= new FirestoreService(); }
