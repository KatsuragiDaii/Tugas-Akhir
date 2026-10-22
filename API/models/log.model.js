var moment = require('moment-timezone');
const sql = require("./db.model");
const SOCKET_TAG = require("../services/realtime/json/socket_tag.json");

const Row = function (Row) {
    this.title = Row.title
};

Row.json = {
    [SOCKET_TAG.pltsPV]: require("../services/realtime/json/pv.json"),
    [SOCKET_TAG.pltsOffGrid]: require("../services/realtime/json/offgrid.json"),
    [SOCKET_TAG.pltsOnGrid]: require("../services/realtime/json/ongrid.json"),
    [SOCKET_TAG.pltb]: require("../services/realtime/json/pltb.json"),
    [SOCKET_TAG.pltmh]: require("../services/realtime/json/pltmh.json")
}

Row.prefix = "tr_";

// Hanya group yang terdaftar yang boleh dipakai (group menjadi bagian nama tabel,
// jadi tidak boleh menerima teks bebas dari URL).
Row.isValidGroup = (group) => Object.prototype.hasOwnProperty.call(Row.json, group);

// Nama tabel = <group>_<YYYYMMDD>. Dihitung per pemanggilan (bukan disimpan di Row.tableName
// yang dipakai bersama), supaya dua request bersamaan tidak saling menimpa.
Row.tableNameFor = (params) => {
    let day;
    if (params.date) {
        const m = moment(params.date);
        if (!m.isValid()) throw new Error("Parameter date tidak valid");
        day = m.format("YYYYMMDD");
    } else if (/^\d{8}$/.test(String(params.periode))) {
        day = String(params.periode);           // dipakai oleh service realtime (YYYYMMDD)
    } else {
        day = moment().format("YYYYMMDD");
    }
    return `${params.group}_${day}`;
};

// Membuat tabel harian bila belum ada. Promise baru selesai SETELAH query selesai,
// dan menolak (reject) bila gagal, sehingga pemanggil bisa tahu kalau DB bermasalah.
Row.create = (params) => {
    if (!Row.isValidGroup(params.group)) {
        return Promise.reject(new Error(`Group tidak dikenal: ${params.group}`));
    }
    let tableName;
    try {
        tableName = Row.tableNameFor(params);
    } catch (error) {
        return Promise.reject(error);
    }

    const columns = Row.json[params.group].map(
        (data) => `\`${data.attr}\` ${data.dataType}${data.dataType === "int" ? " DEFAULT 0" : ""}`
    ).join(", ");

    const query = `CREATE TABLE IF NOT EXISTS \`${tableName}\`
        (
            id int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
            _terminalTime varchar(100) NOT NULL,
            ${columns}
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`;

    return sql.run(query).then(
        () => ({ state: true, tableName, msg: `create table ${tableName} success` })
    );
}

Row.insert = (params) => {
    if (!Row.isValidGroup(params.group)) return;
    let tableName;
    try {
        tableName = Row.tableNameFor(params);
    } catch (error) {
        console.log("ERROR SQL INSERT", error.message);
        return;
    }
    sql.query(`INSERT INTO \`${tableName}\` SET ?`, params.data, (err) => {
        if (err) {
            console.log("ERROR SQL INSERT", tableName, err.code, err.message);
        } else {
            console.log("SQL INSERT", tableName, params.group, new Date());
        }
    });
}

Row.insertRequest = (params, newData, result) => {
    Row.create(params).then(
        ({ tableName }) => {
            sql.query(`INSERT INTO \`${tableName}\` SET ?`, newData, (err, res) => {
                if (err) console.log("error: ", err.code, err.message);
                if (typeof result === "function") result(err || null, res);
            });
        }
    ).catch(
        (error) => {
            console.log("error: ", error.code, error.message);
            if (typeof result === "function") result(error, null);
        }
    )
};

// Mengembalikan rata-rata data per jam/menit (tergantung params.periode) untuk satu hari.
// Seluruh nilai dari URL dikirim sebagai parameter (?), bukan ditempel ke teks SQL.
Row.findDaily = (params, result) => {

    if (!Row.isValidGroup(params.group)) {
        return result(new Error(`Group tidak dikenal: ${params.group}`));
    }

    let tableName;
    try {
        tableName = Row.tableNameFor(params);
    } catch (error) {
        return result(error);
    }

    const length = Number(params.periode) === 1 ? 10 : Number(params.periode) === 2 ? 13 : 16;
    const averages = Row.json[params.group].map(
        (data) => `ROUND(AVG(\`${data.attr}\`),2) AS \`${data.attr}\``
    ).join(",");

    // MIN(_terminalTime): kolom non-agregat di dalam GROUP BY ditolak MySQL 8 (ONLY_FULL_GROUP_BY)
    let query = `SELECT MIN(_terminalTime) AS _terminalTime,${averages} FROM \`${tableName}\` ` +
        `WHERE LEFT(_terminalTime,10) = LEFT(?,10) ` +
        `GROUP BY LEFT(_terminalTime,${length}) ` +
        `ORDER BY _terminalTime DESC `;
    const values = [params.date];

    if (params.limit > 0 && params.offset >= 0) {
        query += `LIMIT ? OFFSET ?`;
        values.push(params.limit, params.offset);
    }

    sql.query(query, values, (err, res) => {
        if (err) {
            // Belum ada data untuk hari itu = bukan error. Dulu tabel dibuat dulu di sini,
            // yang membuat tabel kosong baru untuk setiap tanggal yang diminta.
            if (err.code === "ER_NO_SUCH_TABLE") return result(null, []);
            console.log("log.model.js:findDaily error:", err.code, err.message);
            return result(err);
        }
        result(null, res);
    });
}

module.exports = Row;
