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
  if (!session) redirect("/login");
  return <>{children}</>;
}
