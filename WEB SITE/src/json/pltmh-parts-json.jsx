// Bagian-bagian simulator PLTMH yang bisa diklik di model 3D (components/simulator/hydro-model.js).
//  - name        : nama yang ditampilkan; harus sama dengan nama yang dipakai di hydro-model.js
//  - description : penjelasan singkat yang muncul di bawah model saat bagian dipilih
//  - control     : kontrol yang ikut difokuskan saat bagian diklik (kunci di CONTROL_IDS),
//                  atau null bila bagian itu tidak punya kontrol
//  - chip        : true bila bagian ditampilkan sebagai tombol pilih (akses keyboard / layar sentuh)
// Bagian yang tidak tercantum di sini tetap bisa diklik; yang tampil hanya namanya.

// id elemen kontrol di halaman /pltmh (partials/pltmh/index.jsx)
export const CONTROL_IDS = {
    pump: "ctl-pump",
    pelton: "ctl-pelton",
    crossFlow: "ctl-crossflow",
    kaplan: "ctl-kaplan",
    francis: "ctl-francis",
};

export const PLTMH_PARTS = [
    { name: "Pompa", chip: true, control: "pump",
      description: "Memompa air dari reservoir ke pipa utama. Kecepatannya diatur lewat Pump Speed Control; baling-balingnya berputar saat pompa jalan." },
    { name: "Pelton", chip: true, control: "pelton",
      description: "Turbin impuls: semburan air bertekanan memutar mangkuk di tepi roda, cocok untuk head tinggi dan debit kecil. Dinyalakan lewat tombol Pelton." },
    { name: "Cross Flow", chip: true, control: "crossFlow",
      description: "Turbin aliran silang: air menembus roda berbilah dua kali, cocok untuk head dan debit menengah. Dinyalakan lewat tombol Cross Flow." },
    { name: "Kaplan", chip: true, control: "kaplan",
      description: "Turbin reaksi berbaling-baling, cocok untuk head rendah dan debit besar. Dinyalakan lewat tombol Kaplan." },
    { name: "Francis", chip: true, control: "francis",
      description: "Turbin reaksi aliran radial, cocok untuk head dan debit menengah. Dinyalakan lewat tombol Francis." },
    { name: "Reservoir", chip: true, control: null,
      description: "Bak penampung air yang bersirkulasi: dipompa naik, melewati turbin, lalu kembali ke sini." },
    { name: "Pipa utama", chip: true, control: null,
      description: "Pipa dari pompa yang membagi air ke keempat turbin. Menyala biru saat air mengalir." },
    { name: "Pipa turbin", control: null,
      description: "Pipa masuk dan keluar tiap turbin. Menyala biru saat turbinnya dialiri air." },
    { name: "Rak tengah", control: null, description: "Rak penyangga keempat turbin." },
    { name: "Dinding belakang", control: null, description: "Dinding belakang rangka." },
    { name: "Rangka", control: null, description: "Tiang rangka prototipe." },
    { name: "Rangka bawah", control: null, description: "Rangka dasar prototipe." },
    { name: "Roda", control: null, description: "Roda penggerak prototipe." },
];
