// Data praktikum PLTS (dipindahkan apa adanya dari partials/plts/index.jsx).
// title/url/description dipakai untuk tautan di halaman /plts; extraInfo = deskripsi lengkap praktikum.
export const pltsPraktikum = [
  {
    title: "PV",
    description: "PV simulation practical",
    extraInfo: `Praktikum PLTS PV (Photovoltaic) dirancang untuk memberikan pemahaman yang mendalam mengenai prinsip kerja modul surya melalui pengujian terhadap kinerja komponen utama, yaitu panel surya dan lampu sorot sebagai sumber cahaya pengganti sinar matahari, serta perangkat pendukung seperti pemanas (heater) dan kipas (fan). Selain itu, praktikum ini juga mengeksplorasi berbagai faktor yang mempengaruhi produksi energi listrik, di antaranya sudut kemiringan panel surya dan tingkat intensitas cahaya dari lampu yang digunakan.
Dalam praktikum ini, mahasiswa akan mempelajari:
- Analisis karakteristik modul surya seperti tegangan, arus, dan daya.
- Penerapan alat ukur untuk menentukan efisiensi sistem PV.
Praktikum ini menjadi dasar penting untuk memahami teknologi energi terbarukan terutama pada pemanfaatan energi surya.`,
    url: "/plts/pv",
    imageUrl: "/plts.jpg",

  },
  {
    title: "Off-Grid",
    description: "Off-Grid simulation practical",
    extraInfo: `Praktikum PLTS Off-Grid berfokus pada sistem tenaga surya yang bekerja secara mandiri tanpa terhubung ke jaringan listrik utama (grid). 
Mahasiswa akan belajar:
- Merancang sistem off-grid, termasuk baterai, inverter, dan pengendali beban.
- Menentukan kebutuhan daya sesuai aplikasi sistem otonom.
- Melakukan pengujian terhadap kinerja sistem dalam berbagai kondisi beban.

Praktikum ini sangat relevan untuk penerapan di daerah terpencil yang tidak terjangkau oleh jaringan listrik konvensional.`,
    url: "/plts/offgrid",
    imageUrl: "/offgrid.jpg",

  },
  {
    title: "On-Grid",
    description: "On-Grid simulation practical",
    extraInfo: `Praktikum PLTS On-Grid mengajarkan bagaimana sistem tenaga surya terintegrasi dengan jaringan listrik utama. 
Dalam praktikum ini, mahasiswa akan mempelajari:
- Prinsip kerja inverter grid-tied yang menyinkronkan daya surya dengan jaringan listrik.
- Perhitungan efisiensi sistem on-grid dan analisis energi yang dikirim ke atau diterima dari jaringan.
- Studi kasus pemasangan dan pengoperasian PLTS untuk keperluan rumah tangga dan industri.

Praktikum ini memberikan wawasan mengenai implementasi energi terbarukan pada skala besar.`,
    url: "/plts/ongrid",
    imageUrl: "/ongrid.jpg",
  },
];
