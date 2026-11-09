import Link from "next/link";
import { totalRounds } from "@/lib/game-rules";
import { SiteHeader, SiteFooter, StationCards, StationArt } from "./GameDesign";

export function Landing() {
  return (
    <div className="site-shell">
      <SiteHeader>
        <a href="#mga-istasyon" className="nav-link">
          Mga istasyon
        </a>
        <Link href="/login" className="button button-small">
          Pasok, grupo! <span aria-hidden="true">↗</span>
        </Link>
      </SiteHeader>
      <main id="main-content">
        <section className="landing-hero">
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow">
              <span /> TARA, MAY HAMON TAYO!
            </p>
            <h1>
              Kaalaman.
              <br />
              Tawanan.
              <br />
              <span>
                Bayanihan.
                <svg
                  viewBox="0 0 420 20"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M5 12Q200 -4 413 10M28 19Q220 6 395 17" />
                </svg>
              </span>
            </h1>
            <p className="hero-description">
              Dito, bawat sagot ay ambag.
              <br />
              Magsama-sama sa isang masayang karera ng Filipino, kaalaman, at
              pagtutulungan.
            </p>
            <div className="hero-actions">
              <Link href="/login" className="button">
                Tara, maglaro! <span aria-hidden="true">↗</span>
              </Link>
              <a href="#paano" className="text-link">
                Paano ito laruin? <span aria-hidden="true">↓</span>
              </a>
            </div>
            <p className="hero-footnote">
              <span aria-hidden="true">✦</span> Sariling grupo. Sariling oras.
              Sama-samang pagkatuto.
            </p>
          </div>
          <div
            className="hero-collage"
            aria-label="Tatlong istasyon ng kaalaman: salita, larawan, at lugar"
          >
            <span className="collage-note">KAALAMAN + KULIT</span>
            <span className="collage-star star-one" aria-hidden="true">
              ✳
            </span>
            <div className="hero-notebook">
              <span className="notebook-binding" aria-hidden="true" />
              <p className="eyebrow">ANG MISYON NINYO</p>
              <h2>
                Isang grupo.
                <br />
                Kayang-kaya!
              </h2>
              <div className="notebook-lines">
                <p>
                  <span>01</span> Buuin ang salita <b>✓</b>
                </p>
                <p>
                  <span>02</span> Ayusin ang kuwento <b>✓</b>
                </p>
                <p>
                  <span>03</span> Tuklasin ang lugar <b>✦</b>
                </p>
              </div>
              <div className="notebook-bottom">
                <strong>{totalRounds}</strong>
                <span>
                  hamon para sa
                  <br />
                  buong barkada
                </span>
                <span className="notebook-smile" aria-hidden="true">
                  ☺
                </span>
              </div>
            </div>
            <div className="collage-letter">
              <StationArt kind="letters" />
            </div>
            <span className="collage-ticket">
              MAY AMBAG
              <br />
              <strong>ANG BAWAT ISA.</strong>
            </span>
            <span className="collage-star star-two" aria-hidden="true">
              ✧
            </span>
            <span className="collage-pencil" aria-hidden="true" />
          </div>
        </section>
        <div className="class-banner">
          <span>BAWAT LETRA, MAY POSIBILIDAD.</span>
          <i aria-hidden="true">✦</i>
          <span>BAWAT LARAWAN, MAY KUWENTO.</span>
          <i aria-hidden="true">✦</i>
          <span>BAWAT GRUPO, MAY GALING.</span>
        </div>
        <section id="mga-istasyon" className="stations-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ANG INYONG LAKBAYIN</p>
              <h2>
                Tatlong istasyon.
                <br className="mobile-break" /> Iba-ibang diskarte.
              </h2>
            </div>
            <p>
              Letra, larawan, at mga lugar.
              <br />
              Ilabas ang galing ng inyong grupo!
            </p>
          </div>
          <StationCards preview />
        </section>
        <section id="paano" className="how-section">
          <div>
            <p className="eyebrow">MADALI LANG MAGSIMULA</p>
            <h2>
              Handa ang grupo?
              <br />
              <span>Tayo na!</span>
            </h2>
            <Link href="/login" className="button">
              Pumasok sa karera <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <ol className="how-steps">
            <li>
              <span>01</span>
              <div>
                <h3>Mag-log in bilang grupo.</h3>
                <p>
                  Gamitin ang account na ibinigay sa inyo. Iisa ang progreso ng
                  mga kasapi, kahit magkakaibang aparato.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Magtulungan sa bawat hamon.</h3>
                <p>
                  Basahin ang panuto at tapusin ang tatlong istasyon. Maaaring
                  maglaro ang bawat grupo sa magkakaibang oras.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Tapusin ang karera!</h3>
                <p>
                  Ang pinakamababang pinagsamang oras sa tatlong istasyon ang
                  panalo. Bawat ambag ay mahalaga.
                </p>
              </div>
            </li>
          </ol>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
