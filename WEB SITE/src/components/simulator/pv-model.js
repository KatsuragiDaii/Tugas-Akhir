// Model 3D simulator PLTS (PV simulator).
//
// Geometri dipindahkan dari repo Virtual-Lab-Smartgrid (goesaditya), fungsi solar() di
// src/app.js, lalu ditulis ulang agar terbaca. Ditambahkan:
//   - nama untuk setiap bagian (untuk klik dan label), lihat json/plts-parts-json.jsx
//   - kipas dan pemanas, yang tidak ada di model asli, supaya toggle Fan/Heater terlihat efeknya
//     (pemanas di rak dasar dalam kabinet, kipas berdiri di lantai di depan-kanan kabinet)
//
// Model asli direkonstruksi dari gambar desain prototipe, bukan CAD: ukuran bersifat ilustratif.
// Sumbu: x ke kanan, y ke atas, z menghadap penonton. Satuan bebas (sekitar meter).
//
// THREE dikirim sebagai argumen karena three.js dimuat dinamis di browser (lihat Simulator3D.jsx).

export const PV_CAMERA = { position: [3.8, 2.65, 4.7], target: [0, 1.12, 0] };

// Bagian yang ada banyak salinannya; saat diklik, yang disorot hanya salinan yang kena klik
const PER_INSTANCE = new Set(["Rangka", "Roda"]);

const FAN_MAX_RAD_PER_SEC = 15; // sekitar 2,4 putaran per detik: terbaca jelas dan tidak berkedip

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Number(n) || 0));

export function createPvModel(THREE, { reducedMotion = false } = {}) {

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
    panel: mat("#123451", 0.45, 0.3),
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
  // Batang silinder dari titik a ke titik b
  const pipe = (a, b, r, m, parent, name, noBounds) => {
    const from = new THREE.Vector3(...a);
    const to = new THREE.Vector3(...b);
    const dir = to.clone().sub(from);
    const o = cyl(r, r, dir.length(), ...from.clone().add(to).multiplyScalar(0.5).toArray(), m, parent, name, noBounds);
    o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return o;
  };
  // Layar + tombol instrumen (dipakai dua kali, seperti model asli)
  const instrument = (x, y, z, name) => {
    box(0.26, 0.22, 0.08, x, y, z, M.white, root, name);
    box(0.19, 0.09, 0.015, x, y + 0.02, z + 0.048, M.dark, root, name);
    for (let i = 0; i < 3; i++) {
      cyl(0.015, 0.015, 0.018, x - 0.06 + i * 0.06, y - 0.065, z + 0.05, M.yellow, root, name)
        .rotation.x = Math.PI / 2;
    }
  };

  // ---- Rangka beroda ----
  const W = 1.18, H = 2.05, D = 0.9;
  for (const x of [-W / 2, W / 2]) {
    for (const z of [-D / 2, D / 2]) {
      box(0.055, H, 0.055, x, H / 2 + 0.13, z, M.steel, root, "Rangka");
      cyl(0.07, 0.07, 0.045, x, 0.08, z, M.dark, root, "Roda").rotation.z = Math.PI / 2;
    }
  }
  box(W + 0.08, 0.055, D + 0.08, 0, 0.2, 0, M.blue, root, "Rangka bawah");

  // ---- Kabinet ----
  box(1.23, 0.06, 1, 0, 2.18, 0, M.blue, root, "Rangka atas");
  box(0.04, 1.9, 0.9, -0.57, 1.15, 0, M.blue, root, "Kabinet PV");
  box(0.04, 1.9, 0.9, 0.57, 1.15, 0, M.yellow, root, "Kabinet PV");
  box(1.12, 1.9, 0.03, 0, 1.15, -0.44, M.yellow, root, "Dinding belakang");
  box(1.04, 0.05, 0.85, 0, 0.28, 0, M.steel, root, "Rak dasar");

  // ---- Panel surya: grup yang berputar pada porosnya (sudut 90 = tegak, 0 = mendatar) ----
  const panel = new THREE.Group();
  panel.position.set(0, 1.16, 0.06);
  root.add(panel);
  box(0.86, 1.52, 0.035, 0, 0, 0, M.steel, panel, "Panel surya");
  box(0.81, 1.46, 0.012, 0, 0, 0.025, M.panel, panel, "Panel surya");
  // 6 x 10 sel surya. Geometri dipakai bersama agar ringan (satu geometri untuk semua sel).
  const cellGeometry = new THREE.BoxGeometry(0.122, 0.132, 0.006);
  const gridLineGeometry = new THREE.BoxGeometry(0.002, 0.13, 0.008);
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 10; j++) {
      const x = -0.338 + i * 0.135;
      const y = -0.655 + j * 0.145;
      const cell = new THREE.Mesh(cellGeometry, M.panel);
      cell.position.set(x, y, 0.036);
      add(cell, panel, "Panel surya");
      const line = new THREE.Mesh(gridLineGeometry, M.steel);
      line.position.set(x, y, 0.04);
      add(line, panel, "Panel surya");
    }
  }
  for (let i = 0; i < 9; i++) box(0.8, 0.003, 0.008, 0, -0.58 + i * 0.145, 0.042, M.steel, panel, "Panel surya");
  pipe([-0.49, 1.16, 0.06], [0.49, 1.16, 0.06], 0.045, M.steel, root, "Poros panel");

  // ---- Unit kontrol di sisi kiri ----
  instrument(-0.74, 1.62, 0.12, "Kontrol PV");
  box(0.3, 0.58, 0.25, -0.74, 1.59, 0, M.white, root, "Kotak kontrol");
  instrument(-0.74, 1.7, 0.15, "Kontrol PV");

  // ---- Tiga lampu simulator (terang mengikuti intensitas cahaya) ----
  const bulbs = [-0.37, 0, 0.37].map((x) =>
    box(0.22, 0.09, 0.13, x, 2.02, 0.29,
      new THREE.MeshStandardMaterial({ color: "#fff0bc", emissive: "#ffca55", emissiveIntensity: 0 }),
      root, "Lampu simulator")
  );

  // ---- Pemanas (tambahan): kotak di rak dasar, kumparan menyala saat aktif ----
  const HEATER = "Pemanas (Heater)";
  box(0.34, 0.1, 0.2, -0.28, 0.36, 0.2, M.dark, root, HEATER);
  const coilMaterial = new THREE.MeshStandardMaterial({
    color: "#4a4a4a", emissive: "#ff4d0f", emissiveIntensity: 0, roughness: 0.5,
  });
  for (let i = 0; i < 5; i++) box(0.3, 0.012, 0.012, -0.28, 0.416, 0.2 + (i - 2) * 0.035, coilMaterial, root, HEATER);

  // ---- Kipas (tambahan): kipas berdiri di lantai, di depan-kanan kabinet, menghadap ke panel ----
  // Sengaja di luar kabinet: di dalam, panel yang miring menutupi kipas dari sudut pandang awal.
  const FAN = "Kipas (Fan)";
  const fan = new THREE.Group();
  fan.position.set(0.84, 0, 0.66);
  fan.rotation.y = Math.atan2(-0.84, -0.66); // sumbu +z kipas menunjuk ke tengah kabinet
  root.add(fan);
  cyl(0.1, 0.11, 0.025, 0, 0.0125, 0, M.steel, fan, FAN);               // alas
  cyl(0.014, 0.014, 0.52, 0, 0.285, 0, M.steel, fan, FAN);              // tiang
  cyl(0.045, 0.045, 0.08, 0, 0.62, -0.07, M.dark, fan, FAN).rotation.x = Math.PI / 2; // motor
  const guard = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.012, 8, 40), M.steel);
  guard.position.set(0, 0.62, 0);
  add(guard, fan, FAN);
  // Cakram tak terlihat untuk area klik: tanpa ini, klik di antara bilah menembus ke belakang kipas
  const hitDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.02, 24),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  hitDisc.rotation.x = Math.PI / 2;
  hitDisc.position.set(0, 0.62, 0);
  add(hitDisc, fan, FAN, true);
  hitDisc.castShadow = false;
  hitDisc.receiveShadow = false;
  const rotor = new THREE.Group();
  rotor.position.set(0, 0.62, 0.0);
  fan.add(rotor);
  cyl(0.03, 0.03, 0.03, 0, 0, 0, M.dark, rotor, FAN, true).rotation.x = Math.PI / 2;
  for (let i = 0; i < 3; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.z = (i * 2 * Math.PI) / 3;
    rotor.add(pivot);
    const blade = box(0.06, 0.12, 0.006, 0, 0.085, 0, M.cyan, pivot, FAN, true);
    blade.rotation.y = 0.35; // bilah sedikit miring seperti baling-baling
  }

  // ---- Keadaan: nilai target dari kontrol, dan nilai yang sedang ditampilkan (halus) ----
  const target = { tilt: 40, intensity: 800, fan: false, heater: false };
  const shown = { tilt: 40, light: 800 / 1200, fanSpeed: 0, heat: 0 };
  const BULB_OFF = new THREE.Color("#6d6a5c");
  const BULB_ON = new THREE.Color("#fff0bc");
  const COIL_OFF = new THREE.Color("#4a4a4a");
  const COIL_ON = new THREE.Color("#ff9a4d");

  const applyShown = (time = 0) => {
    panel.rotation.x = -((90 - shown.tilt) * Math.PI) / 180;
    for (const bulb of bulbs) {
      bulb.material.color.lerpColors(BULB_OFF, BULB_ON, shown.light);
      bulb.material.emissiveIntensity = shown.light * 1.7;
    }
    const pulse = reducedMotion ? 1 : 0.88 + 0.12 * Math.sin(time * 4);
    coilMaterial.color.lerpColors(COIL_OFF, COIL_ON, shown.heat);
    coilMaterial.emissiveIntensity = shown.heat * 1.5 * pulse;
  };

  // Nilai kontrol dari halaman. snap: langsung tampil tanpa transisi (untuk keadaan awal).
  const setState = (next, snap = false) => {
    if ("tilt" in next) target.tilt = clamp(next.tilt, 0, 90);
    if ("intensity" in next) target.intensity = clamp(next.intensity, 0, 1200);
    if ("fan" in next) target.fan = !!next.fan;
    if ("heater" in next) target.heater = !!next.heater;
    if (snap) {
      shown.tilt = target.tilt;
      shown.light = target.intensity / 1200;
      shown.fanSpeed = target.fan ? 1 : 0;
      shown.heat = target.heater ? 1 : 0;
      applyShown();
    }
  };

  // Dipanggil tiap frame: transisi halus yang tidak bergantung pada kecepatan frame
  const tick = (dt, time) => {
    const ease = (rate) => 1 - Math.exp(-dt * rate);
    shown.tilt += (target.tilt - shown.tilt) * ease(10);
    shown.light += (target.intensity / 1200 - shown.light) * ease(10);
    shown.fanSpeed += ((target.fan ? 1 : 0) - shown.fanSpeed) * ease(2.5); // menyala/berhenti bertahap
    shown.heat += ((target.heater ? 1 : 0) - shown.heat) * ease(3);
    rotor.rotation.z -= dt * shown.fanSpeed * FAN_MAX_RAD_PER_SEC * (reducedMotion ? 0.2 : 1);
    applyShown(time);
  };

  // true selama ada yang masih bergerak atau berubah; bila false, frame tidak perlu digambar ulang
  const busy = () =>
    Math.abs(target.tilt - shown.tilt) > 0.01 ||
    Math.abs(target.intensity / 1200 - shown.light) > 0.001 ||
    Math.abs((target.fan ? 1 : 0) - shown.fanSpeed) > 0.001 ||
    shown.fanSpeed > 0.001 ||
    Math.abs((target.heater ? 1 : 0) - shown.heat) > 0.001 ||
    (target.heater && !reducedMotion); // kumparan berdenyut

  // Mesh yang ikut disorot saat bagian dipilih
  const meshesFor = (name, hitMesh) =>
    PER_INSTANCE.has(name) && hitMesh ? [hitMesh] : parts.get(name) || [];

  const dispose = () => {
    root.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
    });
    cellGeometry.dispose();
    gridLineGeometry.dispose();
    Object.values(M).forEach((m) => m.dispose());
    bulbs.forEach((b) => b.material.dispose());
    coilMaterial.dispose();
  };

  setState(target, true);

  return { root, parts, pickables, panel, setState, tick, busy, meshesFor, dispose };
}
