import { For } from "solid-js";

// Tampilan CADANGAN simulator PLTB: gambar SVG tampak samping terowongan angin, tanpa library 3D.
// Dipakai halaman /pltb bila browser tidak mendukung WebGL. Tidak interaktif (tidak bisa diputar
// atau diklik). Bereaksi terhadap keadaan simulasi:
//   props.fan      kecepatan kipas penghisap, 0..1 (menentukan putaran kipas dan aliran udara)
//   props.turbine  kecepatan putar turbin uji, 0..1
//   props.class    kelas CSS untuk <svg>

const AXIS = 112;                       // tinggi sumbu saluran
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Number(n) || 0));

// Tiga garis aliran di tiap bagian yang terlihat: depan corong, ruang uji kaca, belakang kipas
const FLOW_LINES = [
  { x1: 6, x2: 50 },
  { x1: 112, x2: 198 },
  { x1: 366, x2: 396 },
];
const FLOW_OFFSETS = [-16, 0, 16];

export default function SimulatorFallbackWind(props) {

  const fan = () => clamp(props.fan, 0, 1);
  const turbine = () => clamp(props.turbine, 0, 1);
  // detik per putaran / per pergeseran garis: makin cepat kipas, makin kecil
  const fanSeconds = () => 1.8 - 1.4 * fan();
  const turbineSeconds = () => 3 - 2.2 * turbine();

  const label = () =>
    `Simulator PLTB: kipas ${Math.round(fan() * 100)} persen, turbin ${turbine() > 0 ? "berputar" : "diam"}`;

  const blades = (cx, cy, count, length, width, fill) =>
    Array.from({ length: count }, (_, i) => (
      <rect
        x={cx - width / 2} y={cy - length} width={width} height={length * 0.78} rx={width / 2} fill={fill}
        transform={`rotate(${(i * 360) / count} ${cx} ${cy})`}
      />
    ));

  return (
    <svg viewBox="0 0 400 300" class={props.class} role="img" aria-label={label()}>
      {/* Rangka, rak bawah, dan roda */}
      <rect x="40" y="222" width="320" height="8" fill="#172bd1" />
      <For each={[52, 348]}>
        {(x) => (
          <>
            <rect x={x - 3} y="190" width="6" height="74" fill="#a9b6ba" />
            <circle cx={x} cy="272" r="9" fill="#262626" />
          </>
        )}
      </For>

      {/* Panel listrik (kiri) dan kabinet kuning (kanan) di bawah meja */}
      <rect x="74" y="196" width="86" height="64" rx="3" fill="#edf1ee" stroke="#a9b6ba" />
      <circle cx="94" cy="214" r="4" fill="#ef2929" />
      <circle cx="108" cy="214" r="4" fill="#f8d816" />
      <circle cx="122" cy="214" r="4" fill="#28bf3e" />
      <rect x="226" y="196" width="104" height="64" rx="3" fill="#eff21a" stroke="#a9b6ba" />

      {/* Meja praktikum */}
      <rect x="30" y="182" width="340" height="10" rx="2" fill="#bfa77f" />

      {/* Layar kontrol kipas */}
      <rect x="62" y="166" width="42" height="14" rx="2" fill="#a9b6ba" />
      <rect x="65" y="168" width="36" height="9" rx="1" fill={fan() > 0 ? "#12d6b5" : "#18343e"} />

      {/* Dudukan dan generator turbin */}
      <rect x="152" y="132" width="6" height="50" fill="#a9b6ba" />
      <rect x="140" y="178" width="30" height="4" rx="1" fill="#a9b6ba" />
      <rect x="139" y={AXIS - 9} width="20" height="18" rx="4" fill="#edf1ee" stroke="#a9b6ba" />

      {/* Saluran: corong masuk, ruang uji kaca, saluran keluar */}
      <path d={`M 50 ${AXIS - 40} L 112 ${AXIS - 26} L 112 ${AXIS + 26} L 50 ${AXIS + 40} Z`} fill="#00bde5" stroke="#009fd7" stroke-width="2" />
      <rect x="112" y={AXIS - 26} width="86" height="52" fill="#cdeaf0" fill-opacity="0.55" stroke="#009fd7" stroke-width="2" />
      <path d={`M 198 ${AXIS - 26} L 342 ${AXIS - 21} L 342 ${AXIS + 21} L 198 ${AXIS + 26} Z`} fill="#00bde5" stroke="#009fd7" stroke-width="2" />

      {/* Turbin uji (tiga bilah) di ruang uji */}
      <g
        class="sim-spin"
        style={{
          "transform-origin": `155px ${AXIS}px`,
          "animation-duration": `${turbineSeconds()}s`,
          "animation-play-state": turbine() > 0 ? "running" : "paused",
        }}
      >
        {blades(155, AXIS, 3, 24, 7, "#ffffff")}
      </g>
      <circle cx="155" cy={AXIS} r="4.5" fill="#a9b6ba" stroke="#6f7f84" />

      {/* Kipas penghisap di ujung kanan: jeruji, bilah, dan cincin pelindung */}
      <circle cx="356" cy={AXIS} r="25" fill="none" stroke="#a9b6ba" stroke-width="3" />
      <g
        class="sim-spin"
        style={{
          "transform-origin": `356px ${AXIS}px`,
          "animation-duration": `${fanSeconds()}s`,
          "animation-play-state": fan() > 0 ? "running" : "paused",
        }}
      >
        {blades(356, AXIS, 7, 22, 6, "#18343e")}
      </g>
      <circle cx="356" cy={AXIS} r="4.5" fill="#a9b6ba" stroke="#6f7f84" />

      {/* Aliran udara: garis putus-putus yang bergeser ke kanan, hanya saat kipas berjalan */}
      <g opacity={fan() > 0 ? 0.35 + 0.55 * fan() : 0} stroke="#1fa9cf" stroke-width="2" stroke-linecap="round">
        <For each={FLOW_LINES}>
          {(line) => (
            <For each={FLOW_OFFSETS}>
              {(dy) => (
                <line
                  class="sim-flow"
                  x1={line.x1} y1={AXIS + dy} x2={line.x2} y2={AXIS + dy}
                  style={{
                    "animation-duration": `${fanSeconds() * 0.4}s`,
                    "animation-play-state": fan() > 0 ? "running" : "paused",
                  }}
                />
              )}
            </For>
          )}
        </For>
      </g>
    </svg>
  );
}
