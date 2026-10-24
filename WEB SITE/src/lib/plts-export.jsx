import moment from "moment-timezone";
import { PLTS_PARAMETERS } from "~/json/plts-parameter-json";

// Export riwayat PLTS Activity ke CSV.
// Berisi SEMUA parameter (bukan hanya yang sedang dipilih di grafik), satu baris per titik data.

const TIMEZONE = "Asia/Jakarta"; // sama dengan halaman histories
const BOM = "﻿";            // agar Excel membaca UTF-8 (tanpa ini "°C" menjadi rusak)

// "° C" -> "°C", " V" -> "V"
const unitOf = (parameter) => parameter.unit.replace(/\s+/g, "");

// Sel yang memuat koma, tanda kutip, atau baris baru dibungkus tanda kutip (RFC 4180)
const cell = (value) => {
    const text = String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// history: [{ t: waktu (ms), temperature, humidity, light, voltage, current, power }]
export function buildPltsCsv(history) {
    const header = [
        "No",
        "Waktu (WIB)",
        ...PLTS_PARAMETERS.map((p) => `${p.label} (${unitOf(p)})`),
    ];
    const rows = history.map((point, index) => [
        index + 1,
        moment.tz(point.t, TIMEZONE).format("YYYY-MM-DD HH:mm:ss"),
        ...PLTS_PARAMETERS.map((p) => Number(point[p.key]).toFixed(2)),
    ]);
    return BOM + [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
}

// Mengunduh CSV di browser. Hanya dipanggil dari klik tombol (bukan saat render/SSR).
export function downloadPltsCsv(history) {
    const blob = new Blob([buildPltsCsv(history)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `plts-activity_${moment.tz(TIMEZONE).format("YYYYMMDD-HHmmss")}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // jeda singkat: beberapa browser (Safari) masih membaca URL setelah click()
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
