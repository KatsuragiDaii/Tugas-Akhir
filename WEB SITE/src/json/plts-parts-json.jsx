// Bagian-bagian simulator PLTS yang bisa diklik di model 3D (components/simulator/pv-model.js).
//  - name        : nama yang ditampilkan; harus sama dengan nama yang dipakai di pv-model.js
//  - description : penjelasan singkat yang muncul di bawah model saat bagian dipilih
//  - control     : kontrol yang ikut difokuskan saat bagian diklik (kunci di CONTROL_IDS),
//                  atau null bila bagian itu tidak punya kontrol
//  - chip        : true bila bagian ditampilkan sebagai tombol pilih (akses keyboard / layar sentuh)
// Bagian yang tidak tercantum di sini tetap bisa diklik; yang tampil hanya namanya.

// id elemen kontrol di halaman /plts (partials/plts/index.jsx)
export const CONTROL_IDS = {
    tilt: "ctl-tilt",
    light: "ctl-light",
    fan: "ctl-fan",
    heater: "ctl-heater",
};

export const PLTS_PARTS = [
    { name: "Panel surya", chip: true, control: "tilt",
      description: "Sudutnya mengikuti slider Kemiringan Panel (0° mendatar, 90° tegak)." },
    { name: "Lampu simulator", chip: true, control: "light",
      description: "Sumber cahaya pengganti matahari; terangnya mengikuti slider Intensitas Cahaya." },
    { name: "Kipas (Fan)", chip: true, control: "fan",
      description: "Menyala atau mati lewat tombol Fan/Kipas." },
    { name: "Pemanas (Heater)", chip: true, control: "heater",
      description: "Menyala atau mati lewat tombol Heater/Pemanas." },
    { name: "Kontrol PV", chip: true, control: null,
      description: "Unit kontrol dan instrumen ukur pada prototipe." },
    { name: "Kabinet PV", chip: true, control: null,
      description: "Dinding kabinet prototipe." },
    { name: "Poros panel", control: "tilt",
      description: "Poros tempat panel surya berputar saat sudutnya diubah." },
    { name: "Kotak kontrol", control: null,
      description: "Rumah unit kontrol dan instrumen." },
    { name: "Rangka atas", control: null, description: "Rangka bagian atas kabinet." },
    { name: "Dinding belakang", control: null, description: "Dinding belakang kabinet." },
    { name: "Rak dasar", control: null, description: "Rak penyangga di dasar kabinet." },
    { name: "Rangka bawah", control: null, description: "Rangka dasar kabinet." },
    { name: "Rangka", control: null, description: "Tiang rangka kabinet." },
    { name: "Roda", control: null, description: "Roda penggerak prototipe." },
];

export const partInfo = (name) => PLTS_PARTS.find((part) => part.name === name);
