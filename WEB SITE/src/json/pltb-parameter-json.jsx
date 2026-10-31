// Parameter yang ditampilkan di bawah simulator halaman /pltb (kartu + dropdown grafik).
//  - key       : kunci di objek `readings` (lib/pltb-live.jsx)
//  - unit      : satuan di kartu, sudah termasuk spasi bila perlu
//  - chartUnit : satuan di atas sumbu Y grafik
//  - icon      : nama ikon, lihat PARAM_ICONS di components/icons/index.jsx
//  - decimals  : (opsional) jumlah angka di belakang koma; default 1 di kartu dan 2 di CSV
// Urutan array = urutan kartu (3 kolom x 2 baris) dan urutan pilihan dropdown.
// Wind Speed, Voltage, Current, dan Turbine Rotation sama dengan gauge di halaman PLTB sebelumnya;
// Power dan Fan Step ditambahkan agar kartunya genap enam.
export const PLTB_PARAMETERS = [
    { key: "windSpeed", label: "Wind Speed",       unit: " m/s", chartUnit: "m/s",   icon: "wind" },
    { key: "voltage",   label: "Voltage",          unit: " V",   chartUnit: "V",     icon: "bolt" },
    { key: "current",   label: "Current",          unit: " A",   chartUnit: "A",     icon: "bolt" },
    { key: "rpm",       label: "Turbine Rotation", unit: " RPM", chartUnit: "RPM",   icon: "rotate" },
    { key: "power",     label: "Power",            unit: " W",   chartUnit: "W",     icon: "bolt" },
    { key: "fanStep",   label: "Fan Step",         unit: " / 10", chartUnit: "step (0-10)", icon: "fan", decimals: 0 },
];

// Parameter yang dipilih saat halaman dibuka
export const DEFAULT_PARAMETER = "windSpeed";
