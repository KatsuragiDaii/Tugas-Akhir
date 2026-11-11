// Model 3D simulator PLTB (pembangkit listrik tenaga bayu / angin): terowongan angin mini.
//
// Geometri dipindahkan dari repo Virtual-Lab-Smartgrid (goesaditya), fungsi wind() di
// src/app.js, lalu ditulis ulang agar terbaca. Ditambahkan:
//   - nama untuk setiap bagian (untuk klik dan label), lihat json/pltb-parts-json.jsx
//   - kipas penghisap dipindah sedikit ke luar ujung saluran keluar (di model asli ia berada di
//     dalam saluran sehingga hampir tidak terlihat dari samping)
//   - garis-garis aliran udara yang bergerak dari corong masuk ke kipas; makin cepat dan rapat
//     saat kipas makin cepat
//   - layar kontrol kipas menyala saat kipas berjalan
//
// Alur udara: corong masuk (kiri) -> ruang uji transparan dengan turbin -> saluran keluar -> kipas
// penghisap (kanan). Kipas yang berputar menarik udara lewat turbin, dan turbin ikut berputar.
//
// Model asli direkonstruksi dari gambar desain prototipe, bukan CAD: ukuran bersifat ilustratif.
// Sumbu: x ke kanan, y ke atas, z menghadap penonton. Satuan bebas (sekitar meter).
//
// THREE dikirim sebagai argumen karena three.js dimuat dinamis di browser (lihat Simulator3D.jsx).

export const WIND_CAMERA = { position: [4.4, 3.25, 6.5], target: [0, 1.5, 0] };

// Bagian yang ada banyak salinannya; saat diklik, yang disorot hanya salinan yang kena klik
const PER_INSTANCE = new Set(["Rangka meja", "Roda", "Penyangga saluran"]);

const AXIS_Y = 2.28;           // tinggi sumbu saluran
const FAN_X = 1.87;            // posisi kipas penghisap (di luar ujung saluran keluar)
const OMEGA_FAN = 18;          // rad/s pada kipas penuh (sekitar 2,9 putaran/detik: terbaca jelas, tidak berkedip)
const OMEGA_TURBINE = 9;       // rad/s pada turbin berputar penuh

// Garis aliran udara
const STREAK_COUNT = 40;
const STREAK_LENGTH = 0.32;
const STREAK_THICKNESS = 0.024;
const STREAK_SPEED = 2.4;      // satuan/detik pada kipas penuh
const STREAK_FROM = -2.5;      // garis muncul di sini (jauh di kiri corong) dan hilang di STREAK_TO
const STREAK_TO = 2.6;

// Jari-jari bagian dalam saluran di sepanjang sumbu (sama dengan profil saluran di bawah)
const DUCT_PROFILE = [
  [-1.78, 0.66], [-1.65, 0.66], [-1.52, 0.63], [-1.36, 0.57], [-1.16, 0.5], [-0.96, 0.45], [-0.75, 0.43], [-0.43, 0.43],
  [0.43, 0.43], [0.67, 0.415], [0.98, 0.385], [1.29, 0.355], [1.43, 0.35], [1.77, 0.35],
];

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Number(n) || 0));
const smooth = (t) => {
  const u = clamp(t, 0, 1);
  return u * u * (3 - 2 * u);
};

// Jari-jari aliran di posisi x: mengikuti saluran; di luar saluran menyempit ke corong dan melebar lagi
// setelah kipas
const flowRadius = (x) => {
  const first = DUCT_PROFILE[0];
  const last = DUCT_PROFILE[DUCT_PROFILE.length - 1];
  if (x <= first[0]) return first[1] + Math.min(0.25, (first[0] - x) * 0.35);
  if (x >= last[0]) return last[1] + Math.min(0.2, (x - last[0]) * 0.25);
  for (let i = 1; i < DUCT_PROFILE.length; i++) {
    const [x1, r1] = DUCT_PROFILE[i];
    if (x <= x1) {
      const [x0, r0] = DUCT_PROFILE[i - 1];
      return x1 === x0 ? r1 : r0 + ((r1 - r0) * (x - x0)) / (x1 - x0);
    }
  }
  return last[1];
};

export function createWindModel(THREE, { reducedMotion = false } = {}) {

  const root = new THREE.Group();
  const parts = new Map();   // nama bagian -> daftar Mesh
  const pickables = [];      // semua Mesh bernama (target klik)
  const materials = [];      // untuk dispose

  const mat = (color, metalness = 0.1, roughness = 0.6) => {
    const material = new THREE.MeshStandardMaterial({ color, metalness, roughness });
    materials.push(material);
    return material;
  };
  const M = {
    steel: mat("#a9b6ba", 0.75, 0.28),
    dark: mat("#18343e"),
    wood: mat("#bfa77f"),
    white: mat("#edf1ee"),
    shell: mat("#00bde5", 0.28, 0.36),
    flange: mat("#009fd7", 0.4, 0.32),
    yellow: mat("#eff21a", 0.08, 0.5),
    benchBlue: mat("#172bd1", 0.25, 0.42),
  };
  // Layar kontrol kipas: gelap saat kipas mati, menyala hijau-kebiruan saat kipas berjalan
  const screen = new THREE.MeshStandardMaterial({ color: "#18343e", emissive: "#12d6b5", emissiveIntensity: 0, roughness: 0.6 });
  materials.push(screen);
  // Kaca ruang uji: tembus pandang, tidak menulis kedalaman supaya turbin di dalamnya tetap terlihat
  const glass = new THREE.MeshPhysicalMaterial({
    color: "#cdeaf0", transparent: true, opacity: 0.16, roughness: 0.1, metalness: 0, side: THREE.DoubleSide, depthWrite: false,
  });
  materials.push(glass);
  const ductMaterial = M.shell.clone();
  ductMaterial.side = THREE.DoubleSide;
  materials.push(ductMaterial);
  const edgeMaterial = new THREE.LineBasicMaterial({ color: "#52616a", transparent: true, opacity: 0.35 });
  materials.push(edgeMaterial);

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
  // Kotak dengan garis tepi tipis (seperti di model asli)
  const edgeBox = (w, h, d, x, y, z, m, name) => {
    const o = box(w, h, d, x, y, z, m, root, name);
    o.add(new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry), edgeMaterial));
    return o;
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
  // Cakram tak terlihat untuk area klik: tanpa ini, klik di antara bilah menembus ke belakang rotor
  // dan ukuran kotak sorotan rotor tidak terdefinisi (bilah berputar tidak dihitung)
  const hitDisc = (radius, x, name) => {
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, 0.03, 32),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    materials.push(disc.material);
    disc.rotation.z = Math.PI / 2;
    disc.position.set(x, AXIS_Y, 0);
    add(disc, root, name);
    disc.castShadow = false;
    disc.receiveShadow = false;
    return disc;
  };

  // ---- Rangka meja beroda, rak bawah, meja kayu ----
  for (const x of [-1.65, 1.65]) {
    for (const z of [-0.54, 0.54]) {
      edgeBox(0.065, 1.31, 0.065, x, 0.86, z, M.steel, "Rangka meja");
      box(0.16, 0.045, 0.14, x, 0.2, z, M.steel, root);
      cyl(0.095, 0.095, 0.065, x, 0.105, z, M.dark, root, "Roda").rotation.x = Math.PI / 2;
      cyl(0.042, 0.042, 0.071, x, 0.105, z, M.steel, root).rotation.x = Math.PI / 2;
    }
  }
  edgeBox(3.38, 0.065, 1.15, 0, 0.265, 0, M.benchBlue, "Rak bawah");
  for (const z of [-0.54, 0.54]) box(3.35, 0.065, 0.055, 0, 1.43, z, M.steel, root);
  edgeBox(3.65, 0.085, 1.43, 0, 1.5, 0, M.wood, "Meja praktikum");

  // ---- Panel listrik putih (kiri) dan kabinet kuning tinggi (kanan) ----
  edgeBox(0.92, 1.03, 0.89, -1.03, 0.815, 0.025, M.white, "Panel kontrol listrik");
  edgeBox(0.86, 0.97, 0.022, -1.03, 0.815, 0.483, M.white, "Panel kontrol listrik");
  for (const y of [0.43, 1.17]) box(0.024, 0.08, 0.017, -1.44, y, 0.5, M.steel, root);
  ["#ef2929", "#f8d816", "#28bf3e"].forEach((color, i) => {
    cyl(0.025, 0.025, 0.027, -1.1 + i * 0.13, 1.12, 0.51, mat(color), root, "Indikator panel").rotation.x = Math.PI / 2;
  });
  edgeBox(1.38, 1.07, 1.04, 0.91, 0.835, -0.015, M.yellow, "Kabinet kuning");
  for (const y of [0.56, 0.91]) box(1.35, 0.008, 0.012, 0.91, y, 0.512, M.steel, root);

  // ---- Layar kontrol kipas (miring, di kiri depan meja) dan sakelar ----
  const consoleGroup = new THREE.Group();
  consoleGroup.position.set(-1.17, 1.62, 0.47);
  consoleGroup.rotation.x = -Math.PI / 3;
  root.add(consoleGroup);
  box(0.6, 0.32, 0.035, 0, 0, 0, M.steel, consoleGroup, "Layar kontrol kipas");
  box(0.51, 0.235, 0.01, 0, 0, 0.025, screen, consoleGroup, "Layar kontrol kipas");
  for (const x of [-1.42, -0.92]) pipe([x, 1.55, 0.32], [x, 1.72, 0.34], 0.012, M.steel, root);
  edgeBox(0.28, 0.045, 0.22, 0.03, 1.563, 0.49, M.white, "Sakelar kipas");
  ["#e73522", "#242d33", "#27a45f"].forEach((color, i) => {
    cyl(0.019, 0.019, 0.047, -0.05 + i * 0.075, 1.605, 0.49, mat(color), root, "Sakelar kipas");
  });

  // ---- Saluran udara: profil jari-jari sepanjang sumbu x, diputar mengelilingi sumbu ----
  const duct = (profile, material, name) => {
    const points = profile.map(([x, r]) => new THREE.Vector2(r, x));
    const mesh = new THREE.Mesh(new THREE.LatheGeometry(points, 64), material);
    mesh.rotation.z = -Math.PI / 2; // sumbu putar (y) -> sumbu x
    mesh.position.y = AXIS_Y;
    return add(mesh, root, name);
  };
  duct(DUCT_PROFILE.slice(0, 8), ductMaterial, "Corong masuk");
  duct(DUCT_PROFILE.slice(8), ductMaterial, "Saluran keluar");
  duct([[-0.43, 0.43], [0.43, 0.43]], glass, "Ruang uji transparan");

  // Flensa (cincin) dengan baut di sambungan saluran
  const boltGeometry = new THREE.CylinderGeometry(0.012, 0.012, 0.028, 8);
  const ring = (x, r, material = M.flange) => {
    const o = new THREE.Mesh(new THREE.TorusGeometry(r, 0.024, 8, 64), material);
    o.rotation.y = Math.PI / 2;
    o.position.set(x, AXIS_Y, 0);
    add(o, root);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const bolt = new THREE.Mesh(boltGeometry, M.steel);
      bolt.rotation.z = Math.PI / 2;
      bolt.position.set(x, AXIS_Y + Math.cos(a) * r, Math.sin(a) * r);
      add(bolt, root);
    }
  };
  [[-1.78, 0.68], [-1.65, 0.67], [-0.43, 0.445], [0.43, 0.445], [1.32, 0.377], [1.77, 0.36]].forEach(([x, r]) => ring(x, r));
  for (const y of [-0.31, 0.31]) {
    for (const z of [-0.29, 0.29]) pipe([-0.42, AXIS_Y + y, z], [0.42, AXIS_Y + y, z], 0.012, M.steel, root);
  }

  // Dua dudukan cyan menahan saluran di atas meja
  for (const x of [-0.7, 0.94]) {
    box(0.33, 0.025, 0.48, x, 1.555, 0, M.flange, root, "Penyangga saluran");
    box(0.07, 0.3, 0.35, x, 1.71, 0, M.shell, root, "Penyangga saluran");
    pipe([x, 1.64, -0.18], [x, 1.94, -0.29], 0.024, M.shell, root, "Penyangga saluran");
    pipe([x, 1.64, 0.18], [x, 1.94, 0.29], 0.024, M.shell, root, "Penyangga saluran");
  }

  // ---- Turbin uji berbilah tiga di dalam ruang uji, dengan dudukan dan generator ----
  cyl(0.1, 0.1, 0.035, 0.17, 1.865, 0, M.steel, root, "Dudukan turbin");
  cyl(0.036, 0.036, 0.405, 0.17, 2.07, 0, M.steel, root, "Dudukan turbin");
  cyl(0.065, 0.065, 0.17, 0.15, AXIS_Y, 0, M.white, root, "Generator turbin").rotation.z = Math.PI / 2;

  // Rotor: hub + bilah yang berputar mengelilingi sumbu x
  const makeRotor = (x, r, count, name) => {
    const group = new THREE.Group();
    group.position.set(x, AXIS_Y, 0);
    root.add(group);
    cyl(r * 0.17, r * 0.17, 0.065, 0, 0, 0, M.steel, group, name, true).rotation.z = Math.PI / 2;
    for (let i = 0; i < count; i++) {
      const pivot = new THREE.Group();
      pivot.rotation.x = (i * 2 * Math.PI) / count;
      group.add(pivot);
      box(0.018, r * 0.75, r * 0.16, 0, r * 0.53, 0, M.white, pivot, name, true).rotation.y = 0.32;
    }
    return group;
  };
  const TURBINE = "Turbin angin";
  const FAN = "Kipas saluran keluar";
  const turbineRotor = makeRotor(0.035, 0.32, 3, TURBINE);
  hitDisc(0.32, 0.035, TURBINE);

  // ---- Kipas penghisap di ujung kanan saluran keluar, dengan jeruji pelindung ----
  const fanRotor = makeRotor(FAN_X, 0.315, 7, FAN);
  hitDisc(0.315, FAN_X, FAN);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    pipe([1.79, AXIS_Y, 0], [1.79, AXIS_Y + Math.cos(a) * 0.335, Math.sin(a) * 0.335], 0.006, M.dark, root, FAN);
  }
  for (const r of [0.24, 0.13]) {
    const o = new THREE.Mesh(new THREE.TorusGeometry(r, 0.024, 8, 64), M.dark);
    o.rotation.y = Math.PI / 2;
    o.position.set(1.795, AXIS_Y, 0);
    add(o, root, FAN);
  }
  const guard = new THREE.Mesh(new THREE.TorusGeometry(0.335, 0.012, 8, 64), M.steel);
  guard.rotation.y = Math.PI / 2;
  guard.position.set(FAN_X, AXIS_Y, 0);
  add(guard, root, FAN);

  // ---- Garis aliran udara: batang tipis yang bergerak dari kiri ke kanan ----
  // Satu InstancedMesh; posisi dihitung ulang tiap frame. Di kedua ujung jalur garis mengecil (bukan
  // memudar, karena semua garis memakai satu material). Di dalam saluran yang buram garis tertutup
  // dindingnya, jadi hanya terlihat di depan corong, di ruang uji kaca, dan di belakang kipas.
  const streakMaterial = new THREE.MeshBasicMaterial({ color: "#1fa9cf", transparent: true, opacity: 0.8, depthWrite: false });
  materials.push(streakMaterial);
  const streaks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), streakMaterial, STREAK_COUNT);
  streaks.frustumCulled = false; // posisi diubah tiap frame; kotak pembatasnya tidak ikut diperbarui
  streaks.count = 0;
  root.add(streaks);
  // Sebaran tetap (bukan acak) supaya tampilan selalu sama
  const hash = (n) => {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const streakSeed = Array.from({ length: STREAK_COUNT }, (_, i) => ({
    phase: hash(i + 1),                      // titik awal di sepanjang jalur
    angle: hash(i + 101) * Math.PI * 2,      // sudut mengelilingi sumbu
    spread: 0.1 + hash(i + 201) * 0.82,      // jarak dari sumbu (pecahan dari jari-jari aliran)
  }));
  let travel = 0;                            // jarak yang sudah ditempuh semua garis (satuan)
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const SPAN = STREAK_TO - STREAK_FROM;
  const updateStreaks = (level) => {
    const count = level > 0.001 ? Math.max(4, Math.ceil(STREAK_COUNT * level)) : 0;
    streaks.count = count;
    streaks.visible = count > 0;
    for (let i = 0; i < count; i++) {
      const s = streakSeed[i];
      const along = (((s.phase * SPAN + travel) % SPAN) + SPAN) % SPAN;
      const x = STREAK_FROM + along;
      const radius = flowRadius(x) * s.spread;
      // mengecil di kedua ujung jalur: muncul dan hilang tanpa loncatan
      const fade = smooth(along / 0.4) * smooth((SPAN - along) / 0.4);
      position.set(x, AXIS_Y + Math.cos(s.angle) * radius, Math.sin(s.angle) * radius);
      scale.set(STREAK_LENGTH, STREAK_THICKNESS * fade, STREAK_THICKNESS * fade);
      matrix.compose(position, quaternion, scale);
      streaks.setMatrixAt(i, matrix);
    }
    streaks.instanceMatrix.needsUpdate = true;
  };

  // ---- Keadaan: nilai target dari halaman, dan nilai yang sedang ditampilkan (halus) ----
  const target = { fan: 0, turbine: 0 };
  const shown = { fan: 0, turbine: 0 };

  const applyShown = () => {
    screen.emissiveIntensity = shown.fan > 0.001 ? 0.25 + 0.6 * shown.fan : 0;
    updateStreaks(shown.fan);
  };

  // Keadaan dari halaman: { fan: 0..1, turbine: 0..1 }
  //   fan     kecepatan kipas penghisap; menentukan putaran kipas dan aliran udara
  //   turbine kecepatan putar turbin uji
  // snap: langsung tampil tanpa transisi (untuk keadaan awal).
  const setState = (next, snap = false) => {
    if (!next) return;
    if ("fan" in next) target.fan = clamp(next.fan, 0, 1);
    if ("turbine" in next) target.turbine = clamp(next.turbine, 0, 1);
    if (snap) {
      shown.fan = target.fan;
      shown.turbine = target.turbine;
      applyShown();
    }
  };

  // Dipanggil tiap frame: transisi halus yang tidak bergantung pada kecepatan frame
  const tick = (dt) => {
    const ease = (rate) => 1 - Math.exp(-dt * rate);
    const slow = reducedMotion ? 0.2 : 1;
    shown.fan += (target.fan - shown.fan) * ease(3);        // kipas menyala/berhenti bertahap
    shown.turbine += (target.turbine - shown.turbine) * ease(2); // turbin lebih lambat menyusul
    fanRotor.rotation.x -= dt * shown.fan * OMEGA_FAN * slow;
    turbineRotor.rotation.x -= dt * shown.turbine * OMEGA_TURBINE * slow;
    travel += dt * STREAK_SPEED * shown.fan * slow;
    applyShown();
  };

  // true selama ada yang masih bergerak atau berubah; bila false, frame tidak perlu digambar ulang
  const busy = () =>
    shown.fan > 0.001 ||
    shown.turbine > 0.001 ||
    Math.abs(target.fan - shown.fan) > 0.001 ||
    Math.abs(target.turbine - shown.turbine) > 0.001;

  // Mesh yang ikut disorot saat bagian dipilih
  const meshesFor = (name, hitMesh) =>
    PER_INSTANCE.has(name) && hitMesh ? [hitMesh] : parts.get(name) || [];

  const dispose = () => {
    root.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
    });
    boltGeometry.dispose();
    materials.forEach((m) => m.dispose());
    streaks.dispose();
  };

  // Tidak ada bagian yang ukuran sorotannya berubah saat bergerak (bilah berputar tidak dihitung)
  const dynamicParts = new Set();
  // Kaca tidak boleh menutupi turbin di dalamnya saat diklik
  const lowPriorityParts = new Set(["Ruang uji transparan"]);

  setState({ fan: 0, turbine: 0 }, true);

  return { root, parts, pickables, setState, tick, busy, meshesFor, dispose, dynamicParts, lowPriorityParts };
}
