import { useState, type FormEvent } from "react";
import { Check, LoaderCircle } from "./icons";
import { api } from "./api";

export function Auth({ onAuthenticated }: { onAuthenticated: (data: any) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const payload = mode === "register" ? { ...values, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone } : { email: values.email, password: values.password };
      const data = await api<any>(`/auth/${mode}`, { method: "POST", body: JSON.stringify(payload) }); onAuthenticated(data);
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  return <main className="auth-shell">
    <section className="auth-brand">
      <div className="brand-mark"><Check size={24} strokeWidth={3} /></div>
      <div><span className="eyebrow">TASKLITE</span><h1>Less planning.<br />More <em>doing.</em></h1></div>
      <p>A calm place for today’s tasks, helpful reminders, and the people you count on.</p>
      <div className="quote-card"><span>“</span><p>Small steps, clearly seen, make big days possible.</p></div>
    </section>
    <section className="auth-panel">
      <div className="auth-card">
        <span className="eyebrow">{mode === "login" ? "WELCOME BACK" : "START LIGHT"}</span>
        <h2>{mode === "login" ? "Ready for today?" : "Create your space"}</h2>
        <p>{mode === "login" ? "Sign in and pick up where you left off." : "A minute now, a clearer day ahead."}</p>
        <form onSubmit={submit}>
          {mode === "register" && <><label>Name<input name="name" autoComplete="name" required placeholder="Your name" /></label><label>Username<input name="username" required minLength={3} pattern="[a-zA-Z0-9_]+" placeholder="yourname" /></label></>}
          <label>Email<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
          <label>Password<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} placeholder="At least 8 characters" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-btn" disabled={busy}>{busy && <LoaderCircle className="spin" size={18} />}{mode === "login" ? "Sign in" : "Create account"}</button>
        </form>
        <button className="text-btn" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}</button>
      </div>
    </section>
  </main>;
}
