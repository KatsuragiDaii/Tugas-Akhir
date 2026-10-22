const mysql = require("mysql");
const dbConfig = require("../config/db.config.js");

const pool = mysql.createPool({
  host: dbConfig.HOST,
  port: dbConfig.PORT,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.DB,
  connectTimeout: dbConfig.CONNECT_TIMEOUT,
  waitForConnections: true,
  connectionLimit: dbConfig.POOL_LIMIT,
  // Dulu 0 (antrian tanpa batas). Saat DB mati antrian query menumpuk tanpa batas
  // dan memori membengkak. Sekarang query yang kelebihan langsung ditolak.
  queueLimit: 100,
});

const state = { connected: false, waiting: null };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Pesan bantuan yang lebih mudah dipahami daripada error mentah dari library
const hintFor = (err) => {
  const code = err && err.code;
  const msg = (err && err.message) || "";
  if (code === "PROTOCOL_SEQUENCE_TIMEOUT" || /Handshake inactivity timeout/i.test(msg)) {
    return (
      `Port ${dbConfig.HOST}:${dbConfig.PORT} menerima koneksi tetapi server tidak membalas handshake. ` +
      `Kemungkinan: port itu bukan MySQL/MariaDB, servernya macet/belum selesai start, atau reverse-DNS MySQL lambat. ` +
      `Jalankan: node scripts/check-db.js`
    );
  }
  if (code === "ECONNREFUSED") return "MySQL/MariaDB belum menyala atau port salah (cek DB_PORT di .env).";
  if (code === "ER_ACCESS_DENIED_ERROR") return "User/password salah (cek DB_USER dan DB_PASSWORD di .env).";
  if (code === "ER_BAD_DB_ERROR") return `Database '${dbConfig.DB}' belum ada. Buat database lalu import tel_u.sql.`;
  if (code === "ER_NOT_SUPPORTED_AUTH_MODE")
    return "Metode login MySQL 8 tidak didukung paket 'mysql'. Pakai 'mysql2' atau ubah user ke mysql_native_password.";
  if (code === "ENOTFOUND") return "Hostname DB tidak ditemukan (cek DB_HOST di .env).";
  return null;
};

const checkOnce = () =>
  new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) return reject(err);
      conn.release();
      resolve();
    });
  });

// Mencoba terhubung ke DB sampai berhasil. Server API tetap berjalan selama DB belum siap,
// jadi fitur yang tidak butuh DB (monitoring realtime & control) tidak ikut mati.
pool.waitForConnection = () => {
  if (state.waiting) return state.waiting;

  state.waiting = (async () => {
    let attempt = 0;
    let lastHint = null;
    for (;;) {
      attempt++;
      try {
        await checkOnce();
        state.connected = true;
        console.log(
          `[DB] Terhubung ke ${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}` +
            (attempt > 1 ? ` (setelah ${attempt} percobaan)` : "")
        );
        return;
      } catch (err) {
        console.error(
          `[DB] Gagal terhubung ke ${dbConfig.HOST}:${dbConfig.PORT} (percobaan ke-${attempt}): ` +
            `${err.code || "-"} ${err.message}`
        );
        const hint = hintFor(err);
        if (hint && hint !== lastHint) {
          console.error(`[DB] Petunjuk: ${hint}`);
          lastHint = hint;
        }
        // jeda bertambah pelan-pelan: 3s, 6s, 9s ... maksimal 30s
        await sleep(Math.min(dbConfig.RETRY_DELAY * attempt, 30000));
      }
    }
  })();

  return state.waiting;
};

pool.isConnected = () => state.connected;

// Versi Promise dari pool.query -> const rows = await db.run("SELECT ...", [param])
pool.run = (sql, values) =>
  new Promise((resolve, reject) => {
    pool.query(sql, values, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

// Mulai mengecek koneksi segera saat modul dimuat (sama seperti perilaku sebelumnya)
pool.waitForConnection();

module.exports = pool;
