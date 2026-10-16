import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/AuthForms.tsx";
import { getCurrentUser, homeFor } from "@/lib/server/auth.ts";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));

  return <LoginForm />;
}
