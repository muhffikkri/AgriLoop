"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, signUpAction, type AuthState } from "@/app/(auth)/actions.ts";
import { SimBadge } from "@/components/ui/badges.tsx";

const initialState: AuthState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(signInAction, initialState);

  return (
    <form action={action} className="card" noValidate>
      <h1 style={{ fontSize: "1.6rem" }}>Sign in</h1>
      <p className="small muted">Use a demo account or the account you created on this machine.</p>

      {state.error ? (
        <p className="alert alert-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>

      <button className="btn btn-primary" type="submit" disabled={pending} style={{ width: "100%" }}>
        {pending ? "Checking details" : "Sign in"}
      </button>

      <p className="small" style={{ marginTop: 14 }}>
        No account yet? <Link href="/signup">Create one</Link>.
      </p>

      <div className="alert alert-info small" style={{ marginTop: 14 }}>
        <p style={{ margin: "0 0 6px", fontWeight: 600 }}>
          Demo accounts <SimBadge compact />
        </p>
        <p className="mono" style={{ margin: 0, fontSize: "0.8rem" }}>
          farmer@demo.agriloop · buyer@demo.agriloop · aggregator@demo.agriloop · admin@demo.agriloop
          <br />
          password: demo1234
        </p>
      </div>
    </form>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState(signUpAction, initialState);

  return (
    <form action={action} className="card" noValidate>
      <h1 style={{ fontSize: "1.6rem" }}>Create an account</h1>
      <p className="small muted">
        Farmer, buyer and collector accounts can be created here. Admin access is granted by the programme,
        never through this form.
      </p>

      {state.error ? (
        <p className="alert alert-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="role">I am a</label>
        <select className="select" id="role" name="role" defaultValue="farmer" required>
          <option value="farmer">Farmer or farmer group</option>
          <option value="buyer">Buyer or processor</option>
          <option value="aggregator">Collector or transporter</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="name">Name</label>
        <input className="input" id="name" name="name" autoComplete="name" required />
      </div>

      <div className="field">
        <label htmlFor="orgName">Organisation (optional)</label>
        <input className="input" id="orgName" name="orgName" autoComplete="organization" />
        <p className="help">Buyers and collectors work as an organisation. Leave it empty to work alone.</p>
      </div>

      <div className="field">
        <label htmlFor="signup-email">Email</label>
        <input className="input" id="signup-email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="field">
        <label htmlFor="signup-password">Password</label>
        <input
          className="input"
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <p className="help">At least 8 characters.</p>
      </div>

      <button className="btn btn-primary" type="submit" disabled={pending} style={{ width: "100%" }}>
        {pending ? "Creating account" : "Create account"}
      </button>

      <p className="small" style={{ marginTop: 14 }}>
        Already registered? <Link href="/login">Sign in</Link>.
      </p>
    </form>
  );
}
