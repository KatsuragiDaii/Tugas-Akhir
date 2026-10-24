const Log = require("../models/log.model")

exports.create = (params) => {
    return new Promise(
        (resolve, reject) => {
            // console.log("controller/insert.controller.js:create", params.group)
            Log.create(params).then(
                data => {
                    console.log("controller/insert.controller.js:9", params );
                    Log.insert(params)
                    resolve(data)
                }
            ).catch(
                error => {
                    reject(error)
                }
            )
        }
    )
}

exports.insert = (params) => {
    Log.insert(params)
}
