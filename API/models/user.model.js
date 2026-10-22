const sql = require("./db.model");
const Row = {}

Row.tabelName = `users`

Row.create = () => {
    const query = `CREATE TABLE IF NOT EXISTS ${Row.tabelName}
        ( 
            id int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT, 
            name varchar(255) NOT NULL, 
            password varchar(255) NOT NULL, 
            role enum('root', 'admin', 'dosen', 'asisten', 'praktikan') DEFAULT 'praktikan'
        ) 
        ENGINE=InnoDB DEFAULT CHARSET=utf8;`
    sql.query(query, (err) => {
        if (err) console.log("user.model.js:create error:", err.code, err.message);
    });
}

Row.insert = (tabelName, newData, result) => {
    sql.query(`INSERT INTO ${Row.tabelName} SET ?`, newData, (err, res) => {
        if (err) {
            console.log("error: ", err.code, err.message);
            result(err, null);
            return;
        }

        console.log(`created ${Row.tabelName}: `, { id: res.insertId, name: newData.name });
        result(null, { id: res.insertId, ...newData });
    });
};

Row.findById = (id, result) => {
    // "?" membuat nilai id di-escape otomatis (mencegah SQL injection)
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

Row.findByName = (name, result) => {
    // Sebelumnya: WHERE name = "${name}" -> bisa dibobol dengan input seperti  " OR "1"="1
    sql.query(`SELECT * FROM ${Row.tabelName} WHERE name = ?`, [name], (err, res) => {
        if (err) {
            console.log("error: ", err.code, err.message);
            result(err, null);
            return;
        }
        if (res.length) {
            result(null, { state: true, data: res[0] });
            return;
        }

        // not found Row with the name
        result(null, { state: false, code: -1, message: "user name not_found" }, null);
    });
};

Row.getAll = (result) => {
    sql.query(`SELECT * FROM ${Row.tabelName} `, (err, res) => {
        if (err) {
            console.log("error: ", err.code, err.message);
            result(err, null);      // dulu: result(null, err) -> error dikirim sebagai "data" dengan status 200
            return;
        }
        result(null, res);
    });
};

module.exports = Row;
