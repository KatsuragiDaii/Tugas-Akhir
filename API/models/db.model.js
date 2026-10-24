const mysql = require("mysql");
const dbConfig = require("../config/db.config");

console.log("db.model.js", dbConfig)

const connection = mysql.createConnection({
  host: dbConfig.HOST,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.DB
});
try {
  connection.connect(error => {
    if (error) {
      console.log("Error connected to the database.",error);

    } else {
      console.log("Successfully connected to the database.");
    }
  });

} catch (error) {
  console.log(error)
}

module.exports = connection;