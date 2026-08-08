import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Server-side gate for everything under /teacher. The API routes enforce this
 * again on every mutation — this layer exists so an unauthenticated visitor
 * never even sees the console shell.
 */
export default async function TeacherLayout({ children }: LayoutProps<"/teacher">) {
  const session = await getSession();
  // The marker tells the login page it got here by being turned away, so it
  // knows never to bounce straight back — that is what turns a rejected
  // session into an endless flicker instead of a message you can read.
  if (!session) redirect("/login?from=teacher");
  return <>{children}</>;
}
