import type { Metadata } from "next";

import { LoginForm } from "@/components/login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Teacher sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  // `/teacher` sends people here with ?from=teacher when it rejects a session.
  const params = await searchParams;
  const turnedAway = params.from === "teacher";
  return <LoginForm turnedAway={turnedAway} />;
}
