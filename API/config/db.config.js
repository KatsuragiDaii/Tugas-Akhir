// Konfigurasi database. Semua nilai bisa diubah lewat file .env (lihat .env.example)
// sehingga tidak perlu mengedit kode ketika port/password MySQL berbeda.
require("dotenv").config();

const toNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

// Urutan prioritas: DB_* (nama baru)  ->  DB_ANALITIC_* (nama lama di .env proyek ini)  ->  nilai bawaan.
// Sebelumnya kode mengabaikan seluruh variabel DB di .env dan selalu memakai root tanpa password.
// allowEmpty: untuk password, nilai kosong (DB_PASSWORD=) adalah pilihan yang sah (mis. XAMPP).
const pick = (names, allowEmpty = false) => {
  for (const name of names) {
    const value = process.env[name];
    if (value === undefined) continue;
    if (value === "" && !allowEmpty) continue;
    return value;
  }
  return undefined;
};

module.exports = {
  HOST: pick(["DB_HOST", "DB_ANALITIC_HOST"]) || "127.0.0.1",
  PORT: toNumber(pick(["DB_PORT", "DB_ANALITIC_PORT"]), 3306),
  USER: pick(["DB_USER", "DB_ANALITIC_USER"]) || "root",
  PASSWORD: pick(["DB_PASSWORD", "DB_ANALITIC_PASSWORD"], true) || "",
  DB: pick(["DB_NAME", "DB_ANALITIC_NAME"]) || "tel_u",

  // Lama menunggu "sapaan" (handshake) dari server MySQL sebelum dianggap gagal.
  // Bawaan library hanya 10 detik, terlalu singkat bila MySQL baru start / lambat.
  CONNECT_TIMEOUT: toNumber(process.env.DB_CONNECT_TIMEOUT, 20000),
  POOL_LIMIT: toNumber(process.env.DB_POOL_LIMIT, 10),

  // Jeda dasar antar percobaan koneksi ulang saat server baru dinyalakan (ms)
  RETRY_DELAY: toNumber(process.env.DB_RETRY_DELAY, 3000),
};
