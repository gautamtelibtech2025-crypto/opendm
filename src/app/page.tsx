import { redirect } from "next/navigation";

/**
 * Temporary single-instance entry point.
 *
 * Middleware routes authenticated customers to the workspace and everyone
 * else to the customer login page.
 */
export default function HomePage() {
  redirect("/login");
}
