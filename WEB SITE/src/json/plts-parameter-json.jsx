// Parameter yang ditampilkan di bawah simulator halaman /plts (kartu + dropdown grafik).
//  - key       : kunci di objek `readings` (lib/plts-readings.jsx)
//  - unit      : satuan di kartu, sudah termasuk spasi bila perlu
//  - chartUnit : satuan di atas sumbu Y grafik
//  - icon      : nama ikon, lihat PARAM_ICONS di components/icons/index.jsx
// Urutan array = urutan kartu (3 kolom x 2 baris) dan urutan pilihan dropdown.
export const PLTS_PARAMETERS = [
    { key: "temperature", label: "Temperature",     unit: "° C", chartUnit: "°C", icon: "thermometer" },
    { key: "humidity",    label: "Humidity",        unit: "%",   chartUnit: "%",  icon: "humidity" },
    // Kartu memakai "%" seperti gauge di halaman PV; sumbu grafik "cd" mengikuti desain.
    { key: "light",       label: "Light Intensity", unit: "%",   chartUnit: "cd", icon: "bulb" },
    { key: "voltage",     label: "Voltage",         unit: " V",  chartUnit: "V",  icon: "bolt" },
    { key: "current",     label: "Current",         unit: " A",  chartUnit: "A",  icon: "bolt" },
    { key: "power",       label: "Power",           unit: " W",  chartUnit: "W",  icon: "bolt" },
];

// Parameter yang dipilih saat halaman dibuka
export const DEFAULT_PARAMETER = "light";
