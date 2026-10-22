const moment = require("moment");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const app = express();
dotenv.config();

const db = require("./models/db.model");
const mqttService = require("./services/realtime/mqtt.service");

// Satu error yang lolos tidak boleh mematikan server monitoring. Dicatat saja ke log.
// (Untuk produksi, jalankan dengan pm2 supaya otomatis hidup lagi bila benar-benar crash.)
process.on("unhandledRejection", (reason) => console.error("[unhandledRejection]", reason));
process.on("uncaughtException", (error) => console.error("[uncaughtException]", error));

var corsOptions = {
    origin: [
        `http://localhost:` + process.env.CLIENT_PORT,
        `http://localhost:3082`,
        process.env.CLIENT_HOST
    ].filter(Boolean),
    credentials: true,
};
app.use(cors(corsOptions));
console.log("Cors options", corsOptions)

app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// simple route  (dulu format jam "HH:MM:ss" -> MM = bulan, yang benar mm = menit)
app.get("/", (req, res) => {
    return res.json({ message: `Sinergi Portal server. ${moment().format("YYYY-MM-DD HH:mm:ss")}` });
});

// Cek status cepat: buka http://localhost:3080/health
app.get("/health", async (req, res) => {
    let database = false;
    if (db.isConnected()) {
        try {
            // dibatasi 3 detik supaya endpoint ini tidak ikut menggantung bila DB bermasalah
            await Promise.race([
                db.run("SELECT 1"),
                new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
            ]);
            database = true;
        } catch (error) { /* database = false */ }
    }
    res.json({ ok: true, uptime: Math.round(process.uptime()), database, mqtt: mqttService.isConnected() });
});

// Route yang membutuhkan database langsung dijawab 503 selama DB belum siap, daripada
// membuat browser menunggu 10-20 detik lalu error. Route /command TIDAK memakai DB,
// jadi kontrol alat tetap jalan walaupun DB mati.
const requireDb = (req, res, next) => {
    if (db.isConnected()) return next();
    res.status(503).send({ error: true, message: "Database belum tersedia, coba lagi sebentar." });
};
app.use(["/user", "/log", "/api"], requireDb);

require("./routes/praktikum.route")(app);
require("./routes/users.route")(app);
require("./routes/command.route")(app);
require("./routes/log.route")(app);

// Tabel dibuat SETELAH database benar-benar tersambung (dulu dijalankan saat server start,
// sehingga bila DB belum siap tabel tidak pernah dibuat dan gagalnya tidak terlihat).
db.waitForConnection().then(() => {
    require("./models/user.model").create();
    require("./models/praktikum.model").create();
});

// Penangkap error terakhir untuk semua route
app.use((err, req, res, next) => {
    console.error("[express]", err);
    if (res.headersSent) return next(err);
    res.status(500).send({ error: true, message: "Terjadi kesalahan pada server" });
});

const PORT = process.env.APP_PORT || 8080;
const server = app.listen(PORT, (error) => {
    if (error) {
        console.log(error);
    } else {
        console.log(`api_portal Backend Server is running on port ${PORT}.`);
        require("./services/realtime")(server);
    }
});
