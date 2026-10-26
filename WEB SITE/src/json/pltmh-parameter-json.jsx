// Parameter yang ditampilkan di bawah simulator halaman /pltmh (kartu + dropdown grafik).
//  - key       : kunci di objek `readings` (lib/pltmh-live.jsx)
//  - unit      : satuan di kartu, sudah termasuk spasi bila perlu
//  - chartUnit : satuan di atas sumbu Y grafik
//  - icon      : nama ikon, lihat PARAM_ICONS di components/icons/index.jsx
// Urutan array = urutan kartu (3 kolom x 2 baris) dan urutan pilihan dropdown.
// Satuan mengikuti label gauge di halaman PLTMH sebelumnya.
export const PLTMH_PARAMETERS = [
    { key: "flow",     label: "Turbine Water Flow", unit: " m³/s",    chartUnit: "m³/s",    icon: "drop" },
    { key: "voltage",  label: "Voltage",            unit: " V",       chartUnit: "V",       icon: "bolt" },
    { key: "current",  label: "Current",            unit: " A",       chartUnit: "A",       icon: "bolt" },
    { key: "pressure", label: "Pressure",           unit: " psi/bar", chartUnit: "psi/bar", icon: "gauge" },
    { key: "rpm",      label: "Turbine Rotation",   unit: " RPM",     chartUnit: "RPM",     icon: "rotate" },
    { key: "power",    label: "Power",              unit: " W",       chartUnit: "W",       icon: "bolt" },
];

// Parameter yang dipilih saat halaman dibuka
export const DEFAULT_PARAMETER = "voltage";
