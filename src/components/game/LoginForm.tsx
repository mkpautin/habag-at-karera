"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, TOKEN_KEY } from "@/lib/client";
import { SiteHeader, SiteFooter, StationArt } from "./GameDesign";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api<{ token: string; role: string }>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify({ username, password }) },
      );
      sessionStorage.setItem(TOKEN_KEY, result.token);
      router.replace(result.role === "ADMIN" ? "/admin" : "/play");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Hindi makapag-log in.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="site-shell">
      <SiteHeader>
        <span className="header-caption">
          ANG SUSUNOD NA HAMON? KAYANG-KAYA.
        </span>
      </SiteHeader>
      <main id="main-content" className="login-layout">
        <section className="login-intro">
          <p className="eyebrow">MALIGAYANG PAGDATING, KAGRUPO!</p>
          <h1>
            Mas masaya
            <br />
            kapag <span>sama-sama.</span>
          </h1>
          <p>
            Dalhin ang talino, diskarte, at diwa ng bayanihan.
            <br />
            Dito nagsisimula ang inyong karera.
          </p>
          <div className="login-art">
            <StationArt kind="letters" />
            <span className="login-sticker">
              BAWAT ISA,
              <br />
              <strong>MAY AMBAG.</strong>
            </span>
          </div>
          <p className="login-aside">
            ✦ Iisang account. Iisang grupo. Iisang layunin.
          </p>
        </section>
        <section className="login-card">
          <span className="paper-tape" aria-hidden="true" />
          <p className="eyebrow">SIMULAN ANG LAKBAY</p>
          <h2>Pasok, grupo!</h2>
          <p>Mag-log in upang ipagpatuloy ang karera ng inyong grupo.</p>
          <form onSubmit={submit} className="login-form">
            <label>
              Grupo o admin
              <input
                required
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username ng inyong grupo"
              />
            </label>
            <label>
              Password
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ilagay ang inyong password"
              />
            </label>
            {error && (
              <p role="alert" className="feedback feedback-error">
                {error}
              </p>
            )}
            <button disabled={busy} className="button">
              {busy ? "Sandali..." : "Mag-log in"}
              <span aria-hidden="true">↗</span>
            </button>
          </form>
          <p className="login-help">
            Gamitin ang account na ibinigay ng tagapagpadaloy.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
