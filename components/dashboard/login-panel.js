"use client";

import { useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";

export function LoginPanel() {
  const [form, setForm] = useState({ email: "", password: "", token: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message || "No se pudo iniciar sesion");
      return;
    }

    window.location.href = new URLSearchParams(window.location.search).get("next") || "/";
  }

  return (
    <main className="login-shell">
      <section className="login-orbit" aria-hidden="true" />
      <form className="login-panel" onSubmit={submit}>
        <div className="login-badge">
          <ShieldCheck size={18} />
          Central de promociones
        </div>
        <h1>Command Center</h1>
        <p>Acceso operativo para participacion, desparticipacion y auditoria del algoritmo de ventas.</p>

        <label>
          Email
          <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" placeholder="agutierrez.gyo@gmail.com" />
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="current-password" />
        </label>
        <label>
          JWT directo
          <textarea value={form.token} onChange={(event) => setForm({ ...form, token: event.target.value })} rows={4} placeholder="Opcional si ya tenes token" />
        </label>

        {error ? <div className="form-error">{error}</div> : null}

        <button className="primary-button" type="submit" disabled={loading}>
          <LockKeyhole size={18} />
          {loading ? "Validando..." : "Entrar al panel"}
        </button>
      </form>
    </main>
  );
}
