import Link from "next/link";
import { roundCounts, totalRounds } from "@/lib/game-rules";

export const stations = [
  {
    number: 1,
    title: "Ayusin ang mga letra",
    short: "Mga letra",
    description: "Mula sa pinaghalong letra, buuin ang tamang salita.",
    kind: "letters",
    tag: "ISIP AT SALITA",
  },
  {
    number: 2,
    title: "Ayusin ang mga larawan",
    short: "Mga larawan",
    description: "Pagsunod-sunurin ang mga larawan at buuin ang kuwento.",
    kind: "pictures",
    tag: "TINGIN AT KUWENTO",
  },
  {
    number: 3,
    title: "Tukuyin ang lugar",
    short: "Mga lugar",
    description:
      "Kilalanin ang lugar at tuklasin ang mga lalawigan ng Pilipinas.",
    kind: "places",
    tag: "LAKBAY AT TUKLAS",
  },
] as const;

export function Brand() {
  return (
    <Link
      href="/"
      className="brand"
      aria-label="Habag at Karera — Unang pahina"
    >
      <span className="brand-mark" aria-hidden="true">
        h<span>k</span>
        <i>✦</i>
      </span>
      <span>
        habag <span className="brand-at">at</span> karera
        <small>FILIPINO · EDUKASYON · PAKIKIPAGKAPWA</small>
      </span>
    </Link>
  );
}

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="site-header">
      <Brand />
      <nav aria-label="Pangunahing nabigasyon">{children}</nav>
    </header>
  );
}

export function StationArt({
  kind,
}: {
  kind: "letters" | "pictures" | "places";
}) {
  return (
    <div className={`station-art art-${kind}`} aria-hidden="true">
      {kind === "letters" ? (
        <>
          <span className="letter-tile tile-a">A</span>
          <span className="letter-tile tile-b">B</span>
          <span className="letter-tile tile-k">K</span>
          <span className="art-spark">✦</span>
        </>
      ) : kind === "pictures" ? (
        <>
          <span className="picture-frame frame-back">
            <i />
          </span>
          <span className="picture-frame frame-front">
            <i />
          </span>
          <span className="picture-arrow">↝</span>
        </>
      ) : (
        <>
          <span className="map-paper">
            <i />
            <b />
            <em />
          </span>
          <span className="map-pin">●</span>
          <span className="map-route" />
        </>
      )}
    </div>
  );
}

export function StationCards({ preview = false }: { preview?: boolean }) {
  return (
    <div className="station-grid">
      {stations.map((station) => (
        <article
          key={station.number}
          className={`station-card station-${station.number}`}
        >
          <div className="station-card-top">
            <span className="eyebrow">ISTASYON 0{station.number}</span>
            <span className="round-label">
              {roundCounts[station.number]} hamon
            </span>
          </div>
          <StationArt kind={station.kind} />
          <p className="station-tag">{station.tag}</p>
          <h3>{station.title}</h3>
          <p className="station-description">{station.description}</p>
          {preview && (
            <Link className="station-link" href="/login">
              Maghanda sa laro <span aria-hidden="true">↗</span>
            </Link>
          )}
        </article>
      ))}
    </div>
  );
}

export function StationTrail({
  station,
  finished = false,
}: {
  station: number;
  finished?: boolean;
}) {
  return (
    <ol className="station-trail" aria-label="Progreso sa mga istasyon">
      {stations.map((item) => {
        const complete = finished || item.number < station;
        const current = !finished && item.number === station;
        return (
          <li
            key={item.number}
            className={
              complete ? "trail-complete" : current ? "trail-current" : ""
            }
            aria-current={current ? "step" : undefined}
          >
            <span>{complete ? "✓" : `0${item.number}`}</span>
            <div>
              <small>
                {complete ? "NATAPOS" : current ? "KASALUKUYAN" : "ISTASYON"}
              </small>
              <strong>{item.short}</strong>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>Isang karera ng kaalaman at pagtutulungan.</span>
      <span>
        3 istasyon <i>✦</i> {totalRounds} hamon <i>✦</i> Isang grupo
      </span>
    </footer>
  );
}
