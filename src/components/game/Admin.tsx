"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, streamEvents, token, TOKEN_KEY } from "@/lib/client";
import { ResetCompetition } from "./ResetCompetition";
import { SiteHeader, SiteFooter } from "./GameDesign";

type Entry = {
  id: string;
  name: string;
  phase: string;
  rank: number | null;
  times: (number | null)[];
  total: number | null;
};
type Board = { finished: Entry[]; playing: Entry[] };
const time = (ms: number | null) =>
  ms == null
    ? "—"
    : `${String(Math.floor(ms / 60000)).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
function Table({ rows }: { rows: Entry[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[650px] text-left">
        <thead>
          <tr className="border-b text-sm text-slate-600">
            <th className="p-3">Ranggo</th>
            <th className="p-3">Grupo</th>
            <th className="p-3">Istasyon 1</th>
            <th className="p-3">Istasyon 2</th>
            <th className="p-3">Istasyon 3</th>
            <th className="p-3">Kabuuan</th>
            <th className="p-3">Kalagayan</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b last:border-0">
              <td className="p-3 font-bold">{row.rank ?? "—"}</td>
              <td className="p-3 font-semibold">{row.name}</td>
              {row.times.map((value, index) => (
                <td key={index} className="p-3 font-mono">
                  {time(value)}
                </td>
              ))}
              <td className="p-3 font-mono">{time(row.total)}</td>
              <td className="p-3">
                <span
                  className={
                    row.phase === "FINISHED"
                      ? "status-badge status-complete"
                      : "status-badge"
                  }
                >
                  {row.phase === "FINISHED"
                    ? "Natapos"
                    : row.phase === "LANDING"
                      ? "Naghihintay"
                      : `Istasyon ${row.phase.slice(-1)}`}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <p className="p-5 text-slate-500">Wala pang grupo rito.</p>
      )}
    </div>
  );
}
export function Admin() {
  const router = useRouter();
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      setBoard(await api<Board>("/api/admin/leaderboard"));
      setError("");
    } catch (cause) {
      if ((cause as { status?: number }).status === 403)
        router.replace("/login");
      else
        setError(
          cause instanceof Error ? cause.message : "Hindi makuha ang talaan.",
        );
    }
  }, [router]);
  useEffect(() => {
    if (!token()) {
      router.replace("/login");
      return;
    }
    void refresh();
    const controller = new AbortController();
    void streamEvents(
      "/api/admin/events",
      refresh,
      controller.signal,
    );
    const timer = setInterval(() => {
      void refresh();
    }, 30000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [refresh, router]);
  async function signOut() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } finally {
      sessionStorage.removeItem(TOKEN_KEY);
      router.replace("/login");
    }
  }
  return (
    <div className="site-shell">
      <SiteHeader>
        <span className="group-chip">Tagapagpadaloy</span>
        <button onClick={signOut} className="button button-quiet button-small">
          Mag-log out ↗
        </button>
      </SiteHeader>
      <main id="main-content" className="admin-layout">
        <div className="play-title">
          <div>
            <p className="eyebrow">ANG TAKBO NG KARERA</p>
            <h1>Bawat grupo, may galing.</h1>
          </div>
          <p>Progreso at oras ng bawat grupo.</p>
        </div>
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            [
              "Mga Grupo",
              (board?.finished.length ?? 0) + (board?.playing.length ?? 0),
            ],
            ["Mga Istasyon", 3],
            ["Natapos", board?.finished.length ?? 0],
          ].map(([label, value]) => (
            <div key={label} className="admin-stat">
              <p>{label}</p>
              <p className="text-4xl font-black">{value}</p>
            </div>
          ))}
        </section>
        {error && (
          <p role="alert" className="mt-5 text-red-700">
            {error}
          </p>
        )}
        <section className="admin-table-panel">
          <h2 className="text-2xl font-black">Pinal na Ranggo</h2>
          <Table rows={board?.finished ?? []} />
        </section>
        <section className="admin-table-panel">
          <h2 className="text-2xl font-black">Mga Naglalaro</h2>
          <Table rows={board?.playing ?? []} />
        </section>
        <ResetCompetition onReset={refresh} />
      </main>
      <SiteFooter />
    </div>
  );
}
