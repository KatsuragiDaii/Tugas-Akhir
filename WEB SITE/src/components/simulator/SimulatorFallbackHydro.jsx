import { For } from "solid-js";
import { TURBINES } from "./hydro-model";

// Tampilan CADANGAN simulator PLTMH: gambar SVG tampak depan, tanpa library 3D.
// Dipakai halaman /pltmh bila browser tidak mendukung WebGL. Tidak interaktif (tidak bisa diputar
// atau diklik). Bereaksi terhadap keadaan simulasi:
//   props.pump       kecepatan pompa, 0..1
//   props.pelton / crossFlow / kaplan / francis   turbin menyala (true/false)
//   props.class      kelas CSS untuk <svg>

const X = [66, 146, 226, 306]; // posisi tengah tiap turbin, urut sama dengan TURBINES
const TURBINE_Y = 120;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Number(n) || 0));

export default function SimulatorFallbackHydro(props) {

  const pump = () => clamp(props.pump, 0, 1);
  const on = (key) => !!props[key] && pump() > 0;
  // detik per putaran: makin cepat pompa, makin cepat putaran
  const seconds = () => 2.4 - 1.8 * pump();

  const label = () =>
    `Simulator PLTMH: pompa ${Math.round(pump() * 100)} persen, ` +
    TURBINES.map((t) => `${t.name} ${props[t.key] ? "menyala" : "mati"}`).join(", ");

  const water = "#35d6ff";

  return (
    <svg viewBox="0 0 400 300" class={props.class} role="img" aria-label={label()}>
      {/* Dinding belakang dan rangka */}
      <rect x="22" y="30" width="356" height="196" rx="4" fill="#d9be2a" />
      <rect x="22" y="30" width="356" height="196" rx="4" fill="none" stroke="#a9b6ba" stroke-width="5" />
      <rect x="22" y="168" width="356" height="7" fill="#a9b6ba" />

      {/* Pipa utama + pipa masuk/keluar; biru bila dialiri air */}
      <line x1="40" y1="52" x2="372" y2="52" stroke="#8a979b" stroke-width="9" stroke-linecap="round" />
      <For each={X}>
        {(x, i) => {
          const flowing = () => on(TURBINES[i()].key);
          return (
            <>
              <line x1={x} y1="52" x2={x} y2={TURBINE_Y - 24} stroke={flowing() ? water : "#8a979b"} stroke-width="6" />
              <line x1={x} y1={TURBINE_Y + 24} x2={x} y2="226" stroke={flowing() ? water : "#8a979b"} stroke-width="6" />
            </>
          );
        }}
      </For>
      <line
        x1="372" y1="52" x2="372" y2="236"
        stroke={TURBINES.some((t) => on(t.key)) ? water : "#8a979b"} stroke-width="8"
      />

      {/* Turbin */}
      <For each={X}>
        {(x, i) => {
          const turbine = TURBINES[i()];
          return (
            <g>
              <rect x={x - 30} y="86" width="60" height="18" rx="3" fill="#edf1ee" stroke="#a9b6ba" />
              <circle cx={x} cy={TURBINE_Y} r="24" fill="#a9b6ba" stroke="#6f7f84" stroke-width="2" />
              <g
                class="sim-spin"
                style={{
                  "transform-origin": `${x}px ${TURBINE_Y}px`,
                  "animation-duration": `${seconds()}s`,
                  "animation-play-state": on(turbine.key) ? "running" : "paused",
                }}
              >
                <For each={Array.from({ length: Math.min(turbine.blades, 8) }, (_, j) => j)}>
                  {(j) => {
                    const count = Math.min(turbine.blades, 8);
                    return (
                      <rect
                        x={x - 2.5} y={TURBINE_Y - 20} width="5" height="13" rx="1.5" fill="#11a8cf"
                        transform={`rotate(${(j * 360) / count} ${x} ${TURBINE_Y})`}
                      />
                    );
                  }}
                </For>
              </g>
              <circle cx={x} cy={TURBINE_Y} r="5" fill="#18343e" />
              <text x={x} y="154" text-anchor="middle" font-size="10" font-weight="700" fill="#18343e">
                {turbine.name}
              </text>
            </g>
          );
        }}
      </For>

      {/* Reservoir dan air */}
      <rect x="22" y="226" width="356" height="34" rx="3" fill="#a9b6ba" />
      <rect x="32" y="230" width="336" height="6" rx="2" fill="#17afd4" opacity="0.75" />

      {/* Pompa */}
      <rect x="346" y="204" width="36" height="34" rx="4" fill="#165baf" stroke="#0f3f7a" stroke-width="2" />
      <g
        class="sim-spin"
        style={{
          "transform-origin": "364px 221px",
          "animation-duration": `${seconds()}s`,
          "animation-play-state": pump() > 0 ? "running" : "paused",
        }}
      >
        <rect x="350" y="219" width="28" height="4" rx="2" fill="#11a8cf" />
        <rect x="362" y="207" width="4" height="28" rx="2" fill="#11a8cf" />
      </g>

      {/* Kaki dan roda */}
      <rect x="14" y="260" width="372" height="8" fill="#165baf" />
      <For each={[34, 366]}>
        {(x) => <circle cx={x} cy="276" r="8" fill="#262626" />}
      </For>
    </svg>
  );
}
