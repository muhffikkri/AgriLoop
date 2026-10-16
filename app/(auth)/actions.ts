"use server";

import { redirect } from "next/navigation";
import {
  endSession,
  findUserByCredentials,
  homeFor,
  registerUser,
  startSession,
} from "@/lib/server/auth.ts";

export type AuthState = { error?: string; ok?: boolean };

export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email.trim() || !password) return { error: "Enter your email and password" };

  const user = findUserByCredentials(email, password);
  if (!user) return { error: "Those details did not match an active account" };

  await startSession(user);
  redirect(homeFor(user.role));
}

/** Public signup is limited to the three working roles: admin accounts are provisioned by an admin. */
export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const role = String(formData.get("role") ?? "");
  if (role !== "farmer" && role !== "buyer" && role !== "aggregator") {
    return { error: "Choose whether you are a farmer, buyer or collector. Admin accounts are created by the programme." };
  }

  const result = await registerUser({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    role,
    orgName: String(formData.get("orgName") ?? ""),
  });

  if (!result.ok) return { error: result.error };

  await startSession(result.user);
  redirect(homeFor(result.user.role));
}

export async function signOutAction(): Promise<void> {
  await endSession();
  redirect("/");
}
