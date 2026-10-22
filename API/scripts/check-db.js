// Diagnosa koneksi MySQL/MariaDB tanpa library apa pun.
// Pemakaian: node scripts/check-db.js            (membaca DB_HOST / DB_PORT dari .env)
//            node scripts/check-db.js 127.0.0.1 3307
require("dotenv").config();
const net = require("net");

const host = process.argv[2] || process.env.DB_HOST || "127.0.0.1";
const port = Number(process.argv[3] || process.env.DB_PORT || 3306);
const WAIT_MS = Number(process.env.CHECK_WAIT_MS) || 15000;

console.log(`Mengecek ${host}:${port} ...`);

const socket = net.createConnection({ host, port });
let connectedAt = null;
const started = Date.now();

const timer = setTimeout(() => {
  if (connectedAt === null) {
    console.log(`\nHASIL: TCP tidak tersambung dalam ${WAIT_MS / 1000} detik.`);
    console.log("-> Firewall/host salah. Pastikan host dan port benar.");
  } else {
    console.log(`\nHASIL: TCP tersambung (${connectedAt} ms) tetapi server TIDAK mengirim handshake dalam ${WAIT_MS / 1000} detik.`);
    console.log("   Inilah penyebab 'Handshake inactivity timeout'. Penyebab yang paling sering:");
    console.log("   1. Port ini bukan MySQL (dipakai program lain), atau MySQL ada di port lain (XAMPP/MAMP/Docker).");
    console.log("   2. MySQL/MariaDB macet atau masih recovery setelah mati tidak normal. Restart servicenya.");
    console.log("   3. Container Docker/WSL sudah membuka port tetapi MySQL di dalamnya belum siap. Tunggu / cek log container.");
    console.log("   4. Reverse-DNS lambat di MySQL: tambahkan  skip-name-resolve  di my.ini / my.cnf, lalu restart.");
  }
  socket.destroy();
  process.exit(1);
}, WAIT_MS);

socket.once("connect", () => {
  connectedAt = Date.now() - started;
  console.log(`TCP tersambung dalam ${connectedAt} ms, menunggu handshake dari server...`);
});

socket.once("data", (buf) => {
  clearTimeout(timer);
  // Paket greeting MySQL: 4 byte header, 1 byte versi protokol, lalu string versi server berakhir 0x00
  const protocol = buf[4];
  const end = buf.indexOf(0x00, 5);
  const version = end > 5 ? buf.toString("utf8", 5, end) : "(tidak terbaca)";
  if (protocol === 10) {
    console.log(`\nHASIL: OK. Server MySQL/MariaDB menjawab dalam ${Date.now() - started} ms.`);
    console.log(`Versi server : ${version}`);
    if (/^8\.|^9\./.test(version) && !/MariaDB/i.test(version)) {
      console.log("Catatan      : MySQL 8+ memakai caching_sha2_password; paket 'mysql' bisa menolaknya (ER_NOT_SUPPORTED_AUTH_MODE).");
    }
    console.log("Jika aplikasi tetap gagal, masalahnya di user/password/nama database (cek .env).");
    process.exit(0);
  } else {
    console.log(`\nHASIL: Ada program di ${host}:${port}, tetapi BUKAN MySQL (byte protokol = ${protocol}).`);
    console.log("-> Cari program yang memakai port ini, atau ubah DB_PORT.");
    process.exit(1);
  }
});

socket.once("error", (err) => {
  clearTimeout(timer);
  console.log(`\nHASIL: ${err.code || err.message}`);
  if (err.code === "ECONNREFUSED") console.log("-> Tidak ada yang mendengarkan di port ini. MySQL/MariaDB belum menyala atau port salah.");
  process.exit(1);
});
