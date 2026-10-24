const jwt = require('jsonwebtoken');
const { mqttEmiter } = require('../services/realtime/mqtt.service');

const publish = (token, command, data, request, response) => {
    jwt.verify(token, process.env.SECRET_KEY, async (err, decoded) => {
        console.log(err, decoded)
        if (err) {
            response.status(403).send({
                error: true,
                message:
                    err.message || `Some error occurred while retrieving Test .`
            });
        } else {
            // request.userId = decoded.id;
            const result = await mqttEmiter({ command, data })
            console.log(command,data)
            // response.json({ id: request.userId, role: decoded.role, data: request.body })
            response.json(result)
        }
    });
}

exports.pltb = (request, response) => {
    const token = request.headers['authorization'];
    // console.log("controller/command.controller.jsx:pltb:body", request.body)
    if (!token) return response.sendStatus(403);
    publish(token, process.env.VITE_MQTT_PLTB_COMMAND, request.body, request, response)
};

exports.pltmh = (request, response) => {
    const token = request.headers['authorization'];
    // console.log("controller/command.controller.jsx:pltmh:body", request.body)
    if (!token) return response.sendStatus(403);
    publish(token, process.env.VITE_MQTT_PLTMH_COMMAND, request.body, request, response)
};

exports.pv = (request, response) => {
    const token = request.headers['authorization'];
    console.log("controller/command.controller.jsx:pv:body", request.body)
    if (!token) return response.sendStatus(403);
    publish(token, process.env.VITE_MQTT_PV_COMMAND, request.body, request, response)
};

