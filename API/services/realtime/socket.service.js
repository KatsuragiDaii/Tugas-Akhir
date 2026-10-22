const { Server } = require("socket.io");

module.exports = (httpServer, corsOrigin, callback) => {

    console.log("Preparing socket server", corsOrigin)

    // Sebelumnya `socket = io(...)` tanpa deklarasi (variabel global tak sengaja), dan Promise
    // baru selesai setelah ADA klien pertama yang terhubung. Sekarang langsung siap.
    const io = new Server(httpServer, {
        cors: {
            origin: corsOrigin,
            credentials: true
        }
    });

    io.on("connection", (client) => {

        console.log("Socket connection was made by " + client.id);

        // reason membantu mencari tahu siapa yang memutus:
        //  "transport close"            -> tab ditutup / halaman di-refresh
        //  "client namespace disconnect"-> kode frontend memanggil socket.disconnect()
        //  "ping timeout"               -> jaringan/klien tidak merespons
        client.on("disconnect", (reason) => {
            console.log(`${client.id} was disconnected (${reason})`);
        });

        callback(io, client);
    })

    return Promise.resolve(io);
}
