
module.exports = app => {

    var ctrl = require("../controller/praktikum.controller");
    var router = require("express").Router();

    // Retrieve all Tutorials
    router.get("/", ctrl.findAll);

    app.use('/api/praktikum', router);

}