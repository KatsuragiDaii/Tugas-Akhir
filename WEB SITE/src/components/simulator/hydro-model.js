// Model 3D simulator PLTMH (pembangkit listrik tenaga mikro hidro).
//
// Geometri dipindahkan dari repo Virtual-Lab-Smartgrid (goesaditya), fungsi hydro() di
// src/app.js, lalu ditulis ulang agar terbaca. Ditambahkan:
//   - nama untuk setiap bagian (untuk klik dan label), lihat json/pltmh-parts-json.jsx
//   - baling-baling pada pompa, supaya terlihat kapan pompa berjalan
//   - jalur air: pipa menyala dengan garis-garis biru yang mengalir, hanya ke turbin yang
//     dinyalakan, dari pompa lewat pipa utama sampai kembali ke reservoir
//
// Model asli direkonstruksi dari gambar desain prototipe, bukan CAD: ukuran bersifat ilustratif.
// Sumbu: x ke kanan, y ke atas, z menghadap penonton. Satuan bebas (sekitar meter).
//
// THREE dikirim sebagai argumen karena three.js dimuat dinamis di browser (lihat Simulator3D.jsx).

export const HYDRO_CAMERA = { position: [3.4, 2.45, 4.75], target: [0, 1.08, 0] };

// Urutan = urutan dari kiri ke kanan di model; `key` sama dengan kunci keadaan dan kunci tombol
export const TURBINES = [
  { key: "pelton", name: "Pelton", blades: 12 },
  { key: "crossFlow", name: "Cross Flow", blades: 10 },
  { key: "kaplan", name: "Kaplan", blades: 4 },
  { key: "francis", name: "Francis", blades: 8 },
];

// Bagian yang ada banyak salinannya; saat diklik, yang disorot hanya salinan yang kena klik
const PER_INSTANCE = new Set(["Rangka", "Roda", "Pipa turbin"]);

const OMEGA_MAX = 14;       // rad/s pada kecepatan pompa penuh (sekitar 2,2 putaran/detik: terbaca jelas, tidak berkedip)
const DASH_LENGTH = 0.2;    // panjang satu pola garis air di pipa
const DASH_SPEED = 0.9;     // satuan/detik pada kecepatan pompa penuh
const PUMP_MIN_FLOW = 0.25; // pada kecepatan pompa segini jalur air sudah menyala penuh

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Number(n) || 0));

export function createHydroModel(THREE, { reducedMotion = false } = {}) {

  const root = new THREE.Group();
  const parts = new Map();   // nama bagian -> daftar Mesh
  const pickables = [];      // semua Mesh bernama (target klik)

  const mat = (color, metalness = 0.1, roughness = 0.6) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness });
  const M = {
    steel: mat("#a9b6ba", 0.75, 0.28),
    blue: mat("#165baf", 0.4, 0.4),
    yellow: mat("#e6cc26"),
    dark: mat("#18343e"),
    white: mat("#edf1ee"),
    cyan: mat("#11a8cf", 0.45, 0.3),
    water: new THREE.MeshStandardMaterial({ color: "#17afd4", transparent: true, opacity: 0.65 }),
  };

  // Memasang mesh. Bila `name` diisi, mesh jadi bisa diklik dan tercatat di bagian bernama itu.
  // noBounds: mesh bergerak/berputar yang tidak boleh ikut menentukan kotak sorotan.
  const add = (mesh, parent, name, noBounds = false) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    if (name) {
      mesh.userData.partName = name;
      mesh.userData.noBounds = noBounds;
      pickables.push(mesh);
      if (!parts.has(name)) parts.set(name, []);
      parts.get(name).push(mesh);
    }
    return mesh;
  };
  const box = (w, h, d, x, y, z, m, parent, name, noBounds) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    o.position.set(x, y, z);
    return add(o, parent, name, noBounds);
  };
  const cyl = (rt, rb, h, x, y, z, m, parent, name, noBounds) => {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 32), m);
    o.position.set(x, y, z);
    return add(o, parent, name, noBounds);
  };
  // Batang silinder dari titik a ke titik b; sumbu y lokal mengarah dari a ke b
  const pipe = (a, b, r, m, parent, name, noBounds) => {
    const from = new THREE.Vector3(...a);
    const to = new THREE.Vector3(...b);
    const dir = to.clone().sub(from);
    const o = cyl(r, r, dir.length(), ...from.clone().add(to).multiplyScalar(0.5).toArray(), m, parent, name, noBounds);
    o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return o;
  };
  // Layar + tombol instrumen (dipakai di setiap turbin, seperti model asli)
  const instrument = (x, y, z, name) => {
    box(0.26, 0.22, 0.08, x, y, z, M.white, root, name);
    box(0.19, 0.09, 0.015, x, y + 0.02, z + 0.048, M.dark, root, name);
    for (let i = 0; i < 3; i++) {
      cyl(0.015, 0.015, 0.018, x - 0.06 + i * 0.06, y - 0.065, z + 0.05, M.yellow, root, name)
        .rotation.x = Math.PI / 2;
    }
  };

  // ---- Rangka beroda, dinding belakang, rak ----
  const W = 2.5, H = 2.1, D = 0.8;
  for (const x of [-W / 2, W / 2]) {
    for (const z of [-D / 2, D / 2]) {
      box(0.055, H, 0.055, x, H / 2 + 0.13, z, M.steel, root, "Rangka");
      cyl(0.07, 0.07, 0.045, x, 0.08, z, M.dark, root, "Roda").rotation.z = Math.PI / 2;
    }
  }
  box(W + 0.08, 0.055, D + 0.08, 0, 0.2, 0, M.blue, root, "Rangka bawah");
  box(2.38, 1.75, 0.045, 0, 1.33, -0.34, M.yellow, root, "Dinding belakang");
  box(2.45, 0.055, 0.78, 0, 1.05, 0, M.steel, root, "Rak tengah");

  // ---- Reservoir: bak penampung dengan permukaan air ----
  box(2.36, 0.2, 0.7, 0, 0.33, 0, M.steel, root, "Reservoir");
  box(2.15, 0.015, 0.52, 0, 0.44, 0, M.water, root, "Reservoir");

  // ---- Pipa utama: dari pompa naik ke atas, lalu mendatar ke semua turbin ----
  const MANIFOLD_Y = 1.95, MANIFOLD_Z = -0.15;
  pipe([-1.05, MANIFOLD_Y, MANIFOLD_Z], [1.05, MANIFOLD_Y, MANIFOLD_Z], 0.038, M.steel, root, "Pipa utama");
  const PUMP = [0.95, 0.65, 0.19];
  const RISER_X = 1.1;
  pipe([PUMP[0], 0.6, PUMP[2]], [RISER_X, 0.6, PUMP[2]], 0.035, M.steel, root, "Pipa utama");
  pipe([RISER_X, 0.6, PUMP[2]], [RISER_X, MANIFOLD_Y, MANIFOLD_Z], 0.035, M.steel, root, "Pipa utama");

  // ---- Pompa + baling-baling di atasnya (berputar saat pompa jalan) ----
  cyl(0.1, 0.1, 0.3, ...PUMP, M.blue, root, "Pompa");
  const impeller = new THREE.Group();
  impeller.position.set(PUMP[0], PUMP[1] + 0.158, PUMP[2]);
  root.add(impeller);
  cyl(0.078, 0.078, 0.014, 0, 0, 0, M.dark, impeller, "Pompa", true);
  for (let i = 0; i < 2; i++) {
    // dua batang bersilang membentuk baling-baling empat jari
    box(0.14, 0.014, 0.022, 0, 0.012, 0, M.cyan, impeller, "Pompa", true).rotation.y = (i * Math.PI) / 2;
  }

  // ---- Empat turbin ----
  const turbines = TURBINES.map((turbine, i) => {
    const x = -0.93 + i * 0.62;
    pipe([x, MANIFOLD_Y, MANIFOLD_Z], [x, 1.41, MANIFOLD_Z], 0.028, M.steel, root, "Pipa turbin");
    pipe([x, 1.13, 0], [x, 0.49, 0], 0.025, M.steel, root, "Pipa turbin");
    cyl(0.15, 0.15, 0.25, x, 1.28, 0, M.steel, root, turbine.name).rotation.x = Math.PI / 2;

    const rotor = new THREE.Group();
    rotor.position.set(x, 1.28, 0.145);
    root.add(rotor);
    cyl(0.055, 0.055, 0.07, 0, 0, 0, M.dark, rotor, turbine.name, true).rotation.x = Math.PI / 2;
    for (let j = 0; j < turbine.blades; j++) {
      const pivot = new THREE.Group();
      pivot.rotation.z = (j * Math.PI * 2) / turbine.blades;
      rotor.add(pivot);
      box(0.035, 0.095, 0.018, 0, 0.077, 0, M.cyan, pivot, turbine.name, true);
    }
    instrument(x, 1.75, -0.23, turbine.name);
    box(0.24, 0.12, 0.16, x, 1.47, -0.13, M.white, root, turbine.name);
    return { ...turbine, x, rotor };
  });

  // ---- Jalur air: pipa "menyala" dengan garis biru yang mengalir searah aliran ----
  // Setiap ruas dilapisi tabung tipis yang sedikit lebih besar dari pipanya. Teksturnya berupa pola
  // garis terang-redup yang digeser tiap frame. Ruas bersama (pompa, pipa utama) menyala bila
  // salah satu turbin yang memakainya menyala.
  const dashPixels = new Uint8Array(16 * 4);
  for (let i = 0; i < 16; i++) dashPixels.set([255, 255, 255, i < 7 ? 255 : 28], i * 4);
  const makeDashTexture = (repeat) => {
    const texture = new THREE.DataTexture(dashPixels, 1, 16, THREE.RGBAFormat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = texture.minFilter = THREE.LinearFilter;
    texture.repeat.set(1, repeat);
    texture.needsUpdate = true;
    return texture;
  };

  const segments = [];
  // users: indeks turbin yang aliran airnya melewati ruas ini
  const flowSegment = (a, b, radius, users) => {
    const length = new THREE.Vector3(...a).distanceTo(new THREE.Vector3(...b));
    const texture = makeDashTexture(Math.max(1, Math.round(length / DASH_LENGTH)));
    const material = new THREE.MeshBasicMaterial({
      map: texture, color: "#35d6ff", transparent: true, opacity: 0, depthWrite: false,
    });
    const mesh = pipe(a, b, radius + 0.007, material, root);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.visible = false;
    segments.push({ mesh, material, texture, users });
  };
  const ALL = turbines.map((_, i) => i);
  flowSegment([PUMP[0], 0.6, PUMP[2]], [RISER_X, 0.6, PUMP[2]], 0.035, ALL);
  flowSegment([RISER_X, 0.6, PUMP[2]], [RISER_X, MANIFOLD_Y, MANIFOLD_Z], 0.035, ALL);
  // Pipa utama: dari ujung kanan ke kiri; makin ke kiri makin sedikit turbin yang dilayani
  let fromX = RISER_X;
  for (let i = turbines.length - 1; i >= 0; i--) {
    flowSegment([fromX, MANIFOLD_Y, MANIFOLD_Z], [turbines[i].x, MANIFOLD_Y, MANIFOLD_Z], 0.038, ALL.slice(0, i + 1));
    fromX = turbines[i].x;
  }
  turbines.forEach((turbine, i) => {
    flowSegment([turbine.x, MANIFOLD_Y, MANIFOLD_Z], [turbine.x, 1.41, MANIFOLD_Z], 0.028, [i]);
    flowSegment([turbine.x, 1.13, 0], [turbine.x, 0.49, 0], 0.025, [i]);
  });

  // ---- Keadaan: nilai target dari halaman, dan nilai yang sedang ditampilkan (halus) ----
  const target = { pump: 0, on: turbines.map(() => false) };
  const shown = {
    pump: 0,
    spin: turbines.map(() => 0),  // kecepatan putar tiap turbin, 0..1
    flow: turbines.map(() => 0),  // terang jalur air tiap turbin, 0..1
  };

  const flowTarget = (i) => (target.on[i] ? clamp(target.pump / PUMP_MIN_FLOW, 0, 1) : 0);
  const spinTarget = (i) => (target.on[i] ? target.pump : 0);

  const applyShown = () => {
    for (const segment of segments) {
      const level = Math.max(...segment.users.map((i) => shown.flow[i]));
      segment.material.opacity = level;
      segment.mesh.visible = level > 0.01;
    }
  };

  // Keadaan dari halaman: { pump: 0..1, pelton, crossFlow, kaplan, francis: true/false }
  // snap: langsung tampil tanpa transisi (untuk keadaan awal).
  const setState = (next, snap = false) => {
    if (!next) return;
    if ("pump" in next) target.pump = clamp(next.pump, 0, 1);
    turbines.forEach((turbine, i) => {
      if (turbine.key in next) target.on[i] = !!next[turbine.key];
    });
    if (snap) {
      shown.pump = target.pump;
      turbines.forEach((_, i) => {
        shown.spin[i] = spinTarget(i);
        shown.flow[i] = flowTarget(i);
      });
      applyShown();
    }
  };

  // Dipanggil tiap frame: transisi halus yang tidak bergantung pada kecepatan frame
  const tick = (dt) => {
    const ease = (rate) => 1 - Math.exp(-dt * rate);
    const slow = reducedMotion ? 0.2 : 1;
    shown.pump += (target.pump - shown.pump) * ease(3);
    impeller.rotation.y -= dt * shown.pump * OMEGA_MAX * 0.8 * slow;
    turbines.forEach((turbine, i) => {
      shown.spin[i] += (spinTarget(i) - shown.spin[i]) * ease(2.5); // menyala/berhenti bertahap
      shown.flow[i] += (flowTarget(i) - shown.flow[i]) * ease(4);
      turbine.rotor.rotation.z -= dt * shown.spin[i] * OMEGA_MAX * slow;
    });
    const dash = (dt * DASH_SPEED * shown.pump * slow) / DASH_LENGTH;
    for (const segment of segments) segment.texture.offset.y -= dash; // geser ke arah aliran (a -> b)
    applyShown();
  };

  // true selama ada yang masih bergerak atau berubah; bila false, frame tidak perlu digambar ulang
  const busy = () =>
    Math.abs(target.pump - shown.pump) > 0.001 ||
    shown.pump > 0.001 ||
    turbines.some(
      (_, i) =>
        shown.spin[i] > 0.001 ||
        Math.abs(spinTarget(i) - shown.spin[i]) > 0.001 ||
        shown.flow[i] > 0.001 ||
        Math.abs(flowTarget(i) - shown.flow[i]) > 0.001
    );

  // Mesh yang ikut disorot saat bagian dipilih
  const meshesFor = (name, hitMesh) =>
    PER_INSTANCE.has(name) && hitMesh ? [hitMesh] : parts.get(name) || [];

  const dispose = () => {
    root.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
    });
    Object.values(M).forEach((m) => m.dispose());
    for (const segment of segments) {
      segment.texture.dispose();
      segment.material.dispose();
    }
  };

  // Tidak ada bagian yang ukuran sorotannya berubah saat bergerak (bilah berputar tidak dihitung)
  const dynamicParts = new Set();

  setState({ pump: 0 }, true);

  return { root, parts, pickables, setState, tick, busy, meshesFor, dispose, dynamicParts };
}
