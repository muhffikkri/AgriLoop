import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/AuthForms.tsx";
import { getCurrentUser, homeFor } from "@/lib/server/auth.ts";

export const metadata = { title: "Create an account" };

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));

  return <SignupForm />;
}
