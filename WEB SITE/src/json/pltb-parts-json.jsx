// Bagian-bagian simulator PLTB yang bisa diklik di model 3D (components/simulator/wind-model.js).
//  - name        : nama yang ditampilkan; harus sama dengan nama yang dipakai di wind-model.js
//  - description : penjelasan singkat yang muncul di bawah model saat bagian dipilih
//  - control     : kontrol yang ikut difokuskan saat bagian diklik (kunci di CONTROL_IDS),
//                  atau null bila bagian itu tidak punya kontrol
//  - chip        : true bila bagian ditampilkan sebagai tombol pilih (akses keyboard / layar sentuh)
// Bagian yang tidak tercantum di sini tetap bisa diklik; yang tampil hanya namanya.

// id elemen kontrol di halaman /pltb (partials/pltb/index.jsx)
export const CONTROL_IDS = {
    fan: "ctl-fan",
};

export const PLTB_PARTS = [
    { name: "Kipas saluran keluar", chip: true, control: "fan",
      description: "Kipas penghisap di ujung kanan saluran: menarik udara dari corong masuk melewati turbin. Kecepatannya diatur lewat Fan Speed Control." },
    { name: "Turbin angin", chip: true, control: null,
      description: "Turbin uji berbilah tiga di dalam ruang uji. Berputar oleh aliran udara dari kipas; putarannya terbaca di parameter Turbine Rotation." },
    { name: "Generator turbin", chip: true, control: null,
      description: "Mengubah putaran turbin menjadi listrik. Tegangan dan arusnya terbaca di parameter Voltage dan Current." },
    { name: "Corong masuk", chip: true, control: null,
      description: "Saluran masuk berbentuk corong yang mengumpulkan udara dan mengarahkannya ke ruang uji." },
    { name: "Ruang uji transparan", chip: true, control: null,
      description: "Bagian saluran dari bahan bening, tempat turbin uji berada. Garis biru menunjukkan aliran udara saat kipas berjalan." },
    { name: "Saluran keluar", chip: true, control: null,
      description: "Saluran yang menyempit dari ruang uji ke kipas penghisap." },
    { name: "Layar kontrol kipas", control: "fan",
      description: "Layar pengatur kipas pada meja praktikum; menyala saat kipas berjalan. Di halaman ini kecepatan kipas diatur lewat Fan Speed Control." },
    { name: "Sakelar kipas", control: "fan",
      description: "Tombol on/off kipas pada meja praktikum. Di halaman ini kecepatan kipas diatur lewat Fan Speed Control." },
    { name: "Panel kontrol listrik", control: null, description: "Kabinet putih berisi kelistrikan dan pengendali prototipe." },
    { name: "Indikator panel", control: null, description: "Lampu indikator pada panel kontrol listrik." },
    { name: "Kabinet kuning", control: null, description: "Kabinet penyimpanan di bawah meja." },
    { name: "Dudukan turbin", control: null, description: "Tiang penyangga turbin dan generator di dalam ruang uji." },
    { name: "Penyangga saluran", control: null, description: "Dudukan yang menahan saluran udara di atas meja." },
    { name: "Meja praktikum", control: null, description: "Meja kayu tempat saluran udara dipasang." },
    { name: "Rak bawah", control: null, description: "Rak biru di bawah meja." },
    { name: "Rangka meja", control: null, description: "Tiang rangka prototipe." },
    { name: "Roda", control: null, description: "Roda penggerak prototipe." },
];
