"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function LoginPanel() {
  const [form, setForm] = useState({ email: "", password: "" });
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
      <form className="login-panel" onSubmit={submit}>
        <div className="login-logo-wrap">
          <img className="login-logo" src="/meli-logo.png" alt="Mercado Libre" />
        </div>
        <h1>Ingresar al panel</h1>
        <p>Acceso operativo para gestionar promociones.</p>

        <label>
          Email
          <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" placeholder="tu@email.com" />
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="current-password" />
        </label>

        {error ? <div className="form-error">{error}</div> : null}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? <LoadingSpinner size="sm" label="Validando credenciales" /> : <LockKeyhole size={18} />}
          {loading ? "Validando..." : "Entrar al panel"}
        </button>
      </form>
    </main>
  );
}
