export function PlayerInstructions() {
  return (
    <section
      aria-labelledby="instructions-heading"
      className="player-instructions"
    >
      <h3 id="instructions-heading" className="text-2xl font-bold">
        Paano maglaro
      </h3>
      <p className="mt-2 text-slate-700">
        Basahin muna ang mga panuto at maghanda kasama ang inyong grupo bago
        pindutin ang MAGLARO.
      </p>
      <ol className="mt-5 list-decimal space-y-4 pl-5 text-slate-700">
        <li className="pl-1">
          <span className="font-bold text-[var(--ink)]">
            Magtulungan bilang isang grupo.
          </span>{" "}
          Maaaring mag-log in ang mga kasama sa kani-kanilang aparato gamit ang
          account ng inyong grupo. Iisa ang inyong progreso at oras. Kapag may
          nakasagot nang tama, awtomatikong susunod ang buong grupo; ang mga
          sagot na hindi pa naipapasa ay nasa sariling aparato lamang.
        </li>
        <li className="pl-1">
          <span className="font-bold text-[var(--ink)]">
            Istasyon 1: Ayusin ang mga letra.
          </span>{" "}
          Buuin ang limang salita mula sa mga pinaghalong letra. I-type ang
          sagot at pindutin ang Hulaan o Enter. Tinatanggap ang malalaki o
          maliliit na titik.
        </li>
        <li className="pl-1">
          <span className="font-bold text-[var(--ink)]">
            Istasyon 2: Ayusin ang mga larawan.
          </span>{" "}
          May dalawang hanay na may tiglimang larawan. Ayusin ang bawat hanay
          ayon sa tamang pagkakasunod-sunod ng mga pangyayari. Gamitin ang
          hawakan na ☰ upang i-drag ang larawan, o ang mga pindutang ↑ at ↓,
          saka pindutin ang I-check.
        </li>
        <li className="pl-1">
          <span className="font-bold text-[var(--ink)]">
            Istasyon 3: Tukuyin ang lugar.
          </span>{" "}
          Kilalanin ang limang lugar sa mga larawan. Hanapin at piliin sa
          listahan ang lalawigan o Metro Manila kung saan ito matatagpuan, saka
          pindutin ang Hulaan. Kailangang pumili sa listahan matapos maghanap.
        </li>
        <li className="pl-1">
          <span className="font-bold text-[var(--ink)]">
            Gamitin ang Gabay kung kailangan.
          </span>{" "}
          Sa Istasyon 1, magagamit ito makalipas ang tatlong minuto sa
          kasalukuyang salita. Sa Istasyon 3, magagamit ito makalipas ang limang
          minuto sa kasalukuyang larawan. Muling nagsisimula ang paghihintay sa
          bawat bagong hamon. Walang Gabay sa Istasyon 2.
        </li>
        <li className="pl-1">
          <span className="font-bold text-[var(--ink)]">
            Subukang muli at magpatuloy.
          </span>{" "}
          Walang dagdag-oras na parusa sa maling sagot. Kapag natapos ang lahat
          ng hamon sa isang istasyon, pindutin ang Tuloy; sa huling istasyon,
          pindutin ang Tapusin upang makarating sa pahina ng pagtatapos.
        </li>
        <li className="pl-1">
          <span className="font-bold text-[var(--ink)]">
            Bantayan ang oras.
          </span>{" "}
          Awtomatikong nagsisimula ang oras pagpasok sa bawat istasyon at
          humihinto sa huling tamang sagot dito. Patuloy ito kahit mawalan ng
          koneksiyon. Ang mananalo ay ang grupong may pinakamababang pinagsamang
          oras sa tatlong istasyon; maaaring magtabla.
        </li>
      </ol>
      <p className="mt-5 font-semibold text-[var(--ink)]">
        Kapag handa na ang lahat at may hudyat na ang tagapagpadaloy, isang
        kasama lamang ang kailangang pumindot ng MAGLARO para sa buong grupo.
      </p>
    </section>
  );
}
