const { verifyToken } = require("../middleware/verifyToken.middleware");

module.exports = app => {

    var ctrl = require("../controller/users.controller");
    var router = require("express").Router();

    console.log("users.route:users.controller.js")

    router.post("/login", ctrl.login);
    router.post("/insert", ctrl.insert);
    router.get("/byToken", verifyToken, ctrl.findByToken);
    router.get("/", verifyToken, ctrl.findAll);
    
    app.use('/user', router);

}