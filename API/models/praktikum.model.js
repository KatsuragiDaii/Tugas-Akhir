// Dulu: require("../models/user.model") -> objek itu tidak punya .query, sehingga semua
// fungsi di file ini error. Yang benar adalah koneksi database.
const sql = require("./db.model");

// constructor
const Row = function (Row) {
    this.title = Row.title;
    this.description = Row.description;
    this.published = Row.published;
};

Row.tabelName = `praktikum`

Row.create = () => {
    const query = `CREATE TABLE IF NOT EXISTS ${Row.tabelName}
        ( 
            id int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT, 
            name varchar(255) NOT NULL, 
            description varchar(255) NOT NULL, 
            image varchar(255) NOT NULL, 
            url varchar(255) DEFAULT 'KABUPATEN MINAHASA TENGGARA' 
        ) 
        ENGINE=InnoDB DEFAULT CHARSET=utf8;`
    sql.query(query, (err) => {
        if (err) console.log("praktikum.model.js:create error:", err.code, err.message);
    });
}

Row.insert = (tabelName, newData, result) => {
    sql.query(`INSERT INTO ${Row.tabelName} SET ?`, newData, (err, res) => {
        if (err) {
            console.log("error: ", err.code, err.message);
            result(err, null);
            return;
        }

        console.log(`created ${Row.tabelName}: `, { id: res.insertId, ...newData });
        result(null, { id: res.insertId, ...newData });
    });
};

Row.findById = (id, result) => {
    sql.query(`SELECT * FROM ${Row.tabelName} WHERE id = ?`, [id], (err, res) => {
        if (err) {
            console.log("error: ", err.code, err.message);
            result(err, null);
            return;
        }

        if (res.length) {
            result(null, res[0]);
            return;
        }

        // not found Row with the id
        result({ kind: "not_found" }, null);
    });
};

Row.getAll = (params, result) => {
    // Dulu ada  WHERE `group` = "pscs"  padahal tabel praktikum tidak punya kolom `group`,
    // sehingga query ini selalu error. Filter dihapus.
    sql.query(`SELECT * FROM ${Row.tabelName} `, (err, res) => {
        if (err) {
            console.log("error: ", err.code, err.message);
            result(err, null);
            return;
        }
        result(null, res);
    });
};

Row.remove = (id, result) => {
    sql.query(`DELETE FROM ${Row.tabelName} WHERE id = ?`, [id], (err, res) => {
        if (err) {
            console.log("error: ", err.code, err.message);
            result(err, null);
            return;
        }

        if (res.affectedRows == 0) {
            // not found Row with the id
            result({ kind: "not_found" }, null);
            return;
        }

        console.log("deleted Row with id: ", id);
        result(null, res);
    });
};

Row.removeAll = result => {
    sql.query(`DELETE FROM ${Row.tabelName}`, (err, res) => {
        if (err) {
            console.log("error: ", err.code, err.message);
            result(err, null);
            return;
        }

        console.log(`deleted ${res.affectedRows} Rows`);
        result(null, res);
    });
};

module.exports = Row;
