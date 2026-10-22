import { createMemo, For, Show } from "solid-js";

// Simulator "3D" ringan: gambar SVG dengan proyeksi miring (oblique), tanpa library dan
// tanpa file model. Bereaksi terhadap nilai kontrol:
//   props.tilt       kemiringan panel, 0-90 derajat
//   props.intensity  intensitas cahaya, 0-1200 W/m2
//   props.fan        level kipas, 1-3
//   props.heater     pemanas menyala (true/false)
//   props.class      kelas CSS untuk <svg>
// Untuk model 3D sungguhan (mis. three.js), ganti isi komponen ini dan pertahankan props-nya.

// Titik asal gambar dan ukuran rak (satuan bebas)
const O = { x: 112, y: 268 };
const W = 150; // lebar      (sumbu x)
const D = 110; // kedalaman  (sumbu d, makin besar makin dekat ke penonton)
const H = 222; // tinggi     (sumbu h)

// (x, d, h) -> koordinat layar. Makin dekat ke penonton (d besar), gambar bergeser kanan-bawah.
const proj = (x, d, h) => [O.x + x + 0.5 * d, O.y + 0.4 * d - h];
const fmt = ([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`;
const poly = (corners) => corners.map(([x, d, h]) => fmt(proj(x, d, h))).join(" ");

// Engsel panel surya di dinding belakang; panel memanjang ke depan sepanjang `len`
const HINGE = { x1: 18, x2: 132, d: 18, h: 100, len: 84 };
const COLS = 6;
const ROWS = 4;

// Titik di permukaan panel: u 0..1 (kiri-kanan), v 0..1 (dari engsel ke tepi depan), t = sudut (radian)
const panelPoint = (u, v, t) =>
  proj(
    HINGE.x1 + (HINGE.x2 - HINGE.x1) * u,
    HINGE.d + HINGE.len * Math.cos(t) * v,
    HINGE.h + HINGE.len * Math.sin(t) * v
  );

const [FAN_X, FAN_Y] = proj(W - 26, 62, 52);
const FAN_SECONDS = { 1: 1.6, 2: 0.9, 3: 0.45 };
const LAMPS = [18, 60, 102]; // posisi x lampu di dinding belakang

// Bagian rak yang tidak pernah berubah
const SHAPE = {
  back: poly([[0, 0, 20], [W, 0, 20], [W, 0, H], [0, 0, H]]),
  left: poly([[0, 0, 20], [0, D, 20], [0, D, H], [0, 0, H]]),
  floorTop: poly([[0, 0, 20], [W, 0, 20], [W, D, 20], [0, D, 20]]),
  floorFront: poly([[0, D, 20], [W, D, 20], [W, D, 13], [0, D, 13]]),
  floorRight: poly([[W, 0, 20], [W, D, 20], [W, D, 13], [W, 0, 13]]),
  barBack: poly([[0, 0, H], [W, 0, H], [W, 0, H - 9], [0, 0, H - 9]]),
  barLeft: poly([[0, 0, H], [0, D, H], [0, D, H - 9], [0, 0, H - 9]]),
  barRight: poly([[W, 0, H], [W, D, H], [W, D, H - 9], [W, 0, H - 9]]),
  barFront: poly([[0, D, H], [W, D, H], [W, D, H - 9], [0, D, H - 9]]),
  heater: poly([[24, 70, 22], [74, 70, 22], [74, 70, 36], [24, 70, 36]]),
};

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Number(n) || 0));

export default function Simulator3D(props) {

  const light = () => clamp(props.intensity, 0, 1200) / 1200;
  const tilt = () => clamp(props.tilt, 0, 90);
  const theta = () => (tilt() * Math.PI) / 180;
  const fanSeconds = () => FAN_SECONDS[Math.round(clamp(props.fan, 1, 3))];

  const panel = () => {
    const t = theta();
    return [panelPoint(0, 0, t), panelPoint(1, 0, t), panelPoint(1, 1, t), panelPoint(0, 1, t)].map(fmt).join(" ");
  };

  // Pantulan cahaya di separuh bagian atas panel; makin terang makin jelas
  const glare = () => {
    const t = theta();
    return [panelPoint(0, 0, t), panelPoint(1, 0, t), panelPoint(1, 0.42, t), panelPoint(0, 0.42, t)].map(fmt).join(" ");
  };

  const gridLines = createMemo(() => {
    const t = theta();
    const lines = [];
    for (let i = 1; i < COLS; i++) {
      const a = panelPoint(i / COLS, 0, t);
      const b = panelPoint(i / COLS, 1, t);
      lines.push([a[0], a[1], b[0], b[1]]);
    }
    for (let j = 1; j < ROWS; j++) {
      const a = panelPoint(0, j / ROWS, t);
      const b = panelPoint(1, j / ROWS, t);
      lines.push([a[0], a[1], b[0], b[1]]);
    }
    return lines;
  });

  const hingeA = () => proj(HINGE.x1 - 8, HINGE.d, HINGE.h);
  const hingeB = () => proj(HINGE.x2 + 8, HINGE.d, HINGE.h);

  const label = () =>
    `Simulator PLTS: panel miring ${Math.round(tilt())} derajat, intensitas cahaya ${Math.round(clamp(props.intensity, 0, 1200))} watt per meter persegi, ` +
    `kipas level ${Math.round(clamp(props.fan, 1, 3))}, pemanas ${props.heater ? "menyala" : "mati"}`;

  return (
    <svg viewBox="58 34 276 288" class={props.class} role="img" aria-label={label()}>
      <defs>
        <linearGradient id="sim-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#cdb52e" />
          <stop offset="1" stop-color="#9f8a14" />
        </linearGradient>
        <linearGradient id="sim-left" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#2a5fbf" />
          <stop offset="1" stop-color="#1a458f" />
        </linearGradient>
        <linearGradient id="sim-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#8a8a8a" />
          <stop offset="1" stop-color="#5c5c5c" />
        </linearGradient>
        <linearGradient id="sim-panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#1b4aa0" />
          <stop offset="1" stop-color="#0c2557" />
        </linearGradient>
        {/* Sorot cahaya lampu: terang di dekat lampu, memudar ke bawah */}
        <linearGradient id="sim-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff3a0" stop-opacity="1" />
          <stop offset="1" stop-color="#fff3a0" stop-opacity="0" />
        </linearGradient>
        <filter id="sim-glow" x="-50%" y="-80%" width="200%" height="260%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* Roda belakang */}
      <circle cx={proj(10, 10, 7)[0]} cy={proj(10, 10, 7)[1]} r="7" fill="#262626" />
      <circle cx={proj(W - 10, 10, 7)[0]} cy={proj(W - 10, 10, 7)[1]} r="7" fill="#262626" />

      {/* Dinding belakang dan kiri */}
      <polygon points={SHAPE.back} fill="url(#sim-back)" />
      <polygon points={SHAPE.left} fill="url(#sim-left)" stroke="#173b7a" stroke-width="1" />

      {/* Lantai/rak */}
      <polygon points={SHAPE.floorTop} fill="url(#sim-floor)" />
      <polygon points={SHAPE.floorFront} fill="#3f3f3f" />
      <polygon points={SHAPE.floorRight} fill="#4d4d4d" />

      {/* Rangka atas */}
      <polygon points={SHAPE.barBack} fill="#2457b5" />
      <polygon points={SHAPE.barLeft} fill="#1b4796" />

      {/* Lampu: cahaya dan badan lampu mengikuti intensitas */}
      <For each={LAMPS}>
        {(x) => (
          <>
            <polygon
              points={poly([[x + 4, 1, H - 30], [x + 26, 1, H - 30], [x + 40, 60, H - 125], [x - 10, 60, H - 125]])}
              fill="url(#sim-beam)"
              opacity={0.55 * light()}
            />
            <polygon
              points={poly([[x, 1, H - 14], [x + 30, 1, H - 14], [x + 30, 1, H - 30], [x, 1, H - 30]])}
              fill="#fff6a6"
              stroke="#8a7a14"
              stroke-width="1"
              opacity={0.3 + 0.7 * light()}
            />
          </>
        )}
      </For>

      {/* Pemanas */}
      <Show when={props.heater}>
        <polygon points={SHAPE.heater} fill="#ff9a3c" opacity="0.75" filter="url(#sim-glow)" />
      </Show>
      <polygon
        points={SHAPE.heater}
        fill={props.heater ? "#ff7a2f" : "#4a4a4a"}
        stroke="#222"
        stroke-width="1"
      />
      <For each={[1, 2, 3, 4]}>
        {(i) => {
          const a = proj(24 + i * 10, 70, 22);
          const b = proj(24 + i * 10, 70, 36);
          return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#222" stroke-width="1" opacity="0.6" />;
        }}
      </For>
      <Show when={props.heater}>
        <For each={[34, 49, 64]}>
          {(x, i) => {
            const [sx, sy] = proj(x, 70, 40);
            return (
              <path
                d={`M${sx.toFixed(1)} ${sy.toFixed(1)} q 5 -7 0 -14 t 0 -14`}
                fill="none"
                stroke="#ff8a3d"
                stroke-width="2"
                stroke-linecap="round"
                class="sim-heat"
                style={{ "animation-delay": `${i() * 0.35}s` }}
              />
            );
          }}
        </For>
      </Show>

      {/* Panel surya */}
      <polygon points={panel()} fill="url(#sim-panel)" stroke="#cfd8e3" stroke-width="2.5" stroke-linejoin="round" />
      <For each={gridLines()}>
        {(l) => <line x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} stroke="#7ea2dd" stroke-width="1" opacity="0.65" />}
      </For>
      <polygon points={glare()} fill="#ffffff" opacity={0.04 + 0.26 * light()} />
      {/* Engsel */}
      <line
        x1={hingeA()[0]} y1={hingeA()[1]} x2={hingeB()[0]} y2={hingeB()[1]}
        stroke="#9aa3ad" stroke-width="6" stroke-linecap="round"
      />

      {/* Kipas */}
      <line x1={FAN_X} y1={FAN_Y + 18} x2={FAN_X} y2={proj(W - 26, 62, 20)[1]} stroke="#555" stroke-width="5" />
      <For each={[-8, 0, 8]}>
        {(dy) => (
          <line
            x1={FAN_X - 24} y1={FAN_Y + dy} x2={FAN_X - 42} y2={FAN_Y + dy}
            stroke="#5fb3cc" stroke-width="2" stroke-linecap="round" opacity="0.55"
          />
        )}
      </For>
      <circle cx={FAN_X} cy={FAN_Y} r="19" fill="#e8ebef" stroke="#555" stroke-width="2" />
      <g
        class="sim-spin"
        style={{ "transform-origin": `${FAN_X}px ${FAN_Y}px`, "animation-duration": `${fanSeconds()}s` }}
      >
        <For each={[0, 120, 240]}>
          {(a) => (
            <ellipse
              cx={FAN_X} cy={FAN_Y - 8} rx="4.2" ry="8" fill="#2f7f9a"
              transform={`rotate(${a} ${FAN_X} ${FAN_Y})`}
            />
          )}
        </For>
      </g>
      <circle cx={FAN_X} cy={FAN_Y} r="3" fill="#1e2a33" />

      {/* Tiang depan dan rangka depan */}
      <line x1={proj(0, D, H)[0]} y1={proj(0, D, H)[1]} x2={proj(0, D, 14)[0]} y2={proj(0, D, 14)[1]} stroke="#2457b5" stroke-width="6" />
      <line x1={proj(W, D, H)[0]} y1={proj(W, D, H)[1]} x2={proj(W, D, 14)[0]} y2={proj(W, D, 14)[1]} stroke="#2457b5" stroke-width="6" />
      <line x1={proj(W, 0, H)[0]} y1={proj(W, 0, H)[1]} x2={proj(W, 0, 20)[0]} y2={proj(W, 0, 20)[1]} stroke="#1b4796" stroke-width="6" />
      <polygon points={SHAPE.barRight} fill="#1b4796" />
      <polygon points={SHAPE.barFront} fill="#2b63c9" />

      {/* Roda depan */}
      <circle cx={proj(10, D - 10, 7)[0]} cy={proj(10, D - 10, 7)[1]} r="7.5" fill="#1f1f1f" stroke="#555" stroke-width="1.5" />
      <circle cx={proj(W - 10, D - 10, 7)[0]} cy={proj(W - 10, D - 10, 7)[1]} r="7.5" fill="#1f1f1f" stroke="#555" stroke-width="1.5" />

      {/* Kotak kontrol di sisi kiri */}
      <line x1={O.x - 8} y1={O.y - 112} x2={O.x} y2={O.y - 112} stroke="#9aa5b1" stroke-width="3" />
      <rect x={O.x - 40} y={O.y - 140} width="32" height="70" rx="4" fill="#eef1f4" stroke="#9aa5b1" stroke-width="1.5" />
      <rect x={O.x - 34} y={O.y - 132} width="20" height="12" rx="1.5" fill="#1b3b4a" />
      <circle cx={O.x - 24} cy={O.y - 104} r="2.6" fill="#35d07f" />
      <circle cx={O.x - 24} cy={O.y - 92} r="2.6" fill={props.heater ? "#ff7a2f" : "#b9c0c8"} />
    </svg>
  );
}
