const mqtt = require('mqtt');

let client = null;
let socket = null;

module.exports = (url, topics, callback) => {

    const clientId = `mqtt_${Math.random().toString(16).slice(3)}`

    console.log(`Connecting to ${url}`, topics)

    client = mqtt.connect(url, {
        clientId, clean: true, connectTimeout: 4000, reconnectPeriod: 1000
    });

    // Event "message" didaftarkan SEKALI di sini. Dulu didaftarkan di dalam "connect", padahal
    // "connect" terpicu lagi setiap reconnect, sehingga setiap pesan diproses berkali-kali.
    client.on("message", (topic, payload) => {
        let data;
        try {
            data = JSON.parse(payload);
        } catch (error) {
            // Dulu satu pesan rusak dari alat langsung mematikan server (uncaught exception)
            console.error(`MQTT payload bukan JSON pada topic '${topic}':`, error.message);
            return;
        }

        const split = topic.split("/");
        const group = split[2];
        const code = split[3];

        try {
            callback(socket, group, code, data);
        } catch (error) {
            console.error(`MQTT gagal memproses topic '${topic}':`, error);
        }
    })

    client.on("connect", () => {
        console.log(`MQTT connection to ${url} success, your id ${clientId}`);

        // subscribe ulang di setiap connect karena clean:true menghapus langganan lama
        client.subscribe(topics, (err) => {
            if (err) console.error("MQTT subscribe gagal:", err.message);
            else console.log(`Subscribe to topic '${topics}`)
        })
    })

    // Tanpa listener "error", error koneksi MQTT bisa menjatuhkan proses.
    // Saat broker mati, mqtt.js mencoba ulang tiap detik. Pesan yang sama hanya dicetak
    // sekali per 30 detik supaya log tidak banjir.
    let lastError = "", lastErrorAt = 0;
    client.on("error", (err) => {
        const message = err.message || String(err);
        if (message !== lastError || Date.now() - lastErrorAt > 30000) {
            console.error("MQTT error:", message);
            lastError = message;
            lastErrorAt = Date.now();
        }
    })
    client.on("offline", () => { if (lastError !== "offline") { console.warn("MQTT offline, mencoba tersambung lagi..."); } })
}

module.exports.setSocketForMQTT = (params) => {
    socket = params;
}

module.exports.isConnected = () => !!(client && client.connected);

module.exports.mqttEmiter = (params) => {
    return new Promise((resolve, reject) => {
        // Dulu client yang belum ada/terputus menyebabkan TypeError dan unhandled rejection
        if (!client || !client.connected) {
            return reject(new Error("MQTT broker belum tersambung"));
        }
        if (!params.command) {
            return reject(new Error("Topic command belum diatur di .env (VITE_MQTT_*_COMMAND)"));
        }
        const json = { [params.data.tag]: params.data.value }
        client.publish(params.command, JSON.stringify(json), (err) => {
            if (err) return reject(err);
            console.log("realtime/mqtt.service.js", params.command, json)
            resolve({ state: true, data: { msg: "emiter ok" } })
        });
    })
}
