var moment = require('moment-timezone');
const model = require("../models/log.model");

function Hour() {
    const items = [];
    new Array(24).fill().forEach(
        (acc, index) => {
            items.push(moment({ hour: index }).format('HH:00:00'));
        }
    )
    return items;
}

const getDateRange = (firstDate, lastDate, hourly) => {

    const hours = Hour()

    console.log(firstDate, lastDate)

    if (firstDate.isSame(lastDate, 'day'))
        return [lastDate];

    let date = firstDate

    let dates = [];

    do {
        dates.push(date.format(process.env.DATE_FORMAT_LONG));
        // console.log("COUNT", date.format(process.env.DATE_FORMAT))
        date = date.add(1, 'days');
    } while (date.isBefore(lastDate));
    return dates;
};

exports.createTable = (periode) => {
    model.create(periode);
}

exports.findDaily = (request, response) => {
    const params = {
        group: request.query.group,
        date: request.query.date,
        periode: request.query.periode,
    }

    // Validasi input dulu. Dulu group yang salah menyebabkan error tak tertangani
    // di dalam fungsi async sehingga seluruh server bisa crash.
    if (!model.isValidGroup(params.group)) {
        return response.status(400).send({ error: true, message: "Parameter group tidak valid" });
    }
    if (!params.date || !moment(params.date).isValid()) {
        return response.status(400).send({ error: true, message: "Parameter date tidak valid" });
    }

    const limit = Number(request.query.limit)
    const offset = Number(request.query.offset)
    if (request.query.limit && request.query.offset) {
        if (limit > 0 && offset >= 0) {
            params.limit = limit
            params.offset = offset
        }
    }

    // Tabel tidak lagi dibuat di sini; model.findDaily mengembalikan [] bila tabel hari itu belum ada.
    model.findDaily(
        params,
        (err, data) => {
            if (err) {
                console.log("log.controller.js:findDaily", err.code || "", err.message);
                response.status(500).send({
                    error: true,
                    message: "Gagal mengambil data log"
                });
            } else {
                response.json({ error: false, data });
            }
        }
    )

}
