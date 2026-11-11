import { createMemo } from "solid-js";
import { SOCKET_TAG } from "~/json/socket-tag-json";
import { PLTMH_TAG } from "~/json/pltmh-tag-json";
import { createLiveSource, num } from "~/lib/live-source";

// Kecepatan pompa dari alat berskala 0..10000 = 0..50 Hz (rumus yang sama dengan halaman lama)
export const PUMP_RAW_MAX = 10000;
export const PUMP_MAX_HZ = 50;

const F = PLTMH_TAG.field;

// Pembacaan live PLTMH dari socket (sumber yang sama dengan halaman PLTMH sebelumnya).
// Harus dipanggil di dalam komponen (memakai context).
//
//   online()   -> true bila alat mengirim data dalam 8 detik terakhir
//   device()   -> { pumpFraction: 0..1, pumpHz, turbines: { pelton, crossFlow, kaplan, francis: bool } }
//                 keadaan pompa dan solenoid turbin yang dilaporkan alat (0 / false selama belum ada data)
//   readings() -> { flow, voltage, current, pressure, rpm, power }
//                 semuanya 0 selama belum ada data; power = voltage x current
//   history()  -> riwayat pembacaan untuk grafik dan CSV, lihat createLiveSource
export function createPltmhLive() {

    const { payload, online, readings, history } = createLiveSource(SOCKET_TAG.pltmh, (p) => {
        const voltage = num(p[F.voltage]);
        const current = num(p[F.current]);
        return {
            flow: num(p[F.flow]),
            voltage,
            current,
            pressure: num(p[F.pressure]),
            rpm: num(p[F.rpm]),
            power: voltage * current,
        };
    });

    const device = createMemo(() => {
        const p = payload() || {};
        const pumpFraction = Math.min(1, Math.max(0, num(p[F.pumpSpeed]) / PUMP_RAW_MAX));
        return {
            pumpFraction,
            pumpHz: pumpFraction * PUMP_MAX_HZ,
            turbines: {
                pelton: num(p[F.pelton]) > 0,
                crossFlow: num(p[F.crossFlow]) > 0,
                kaplan: num(p[F.kaplan]) > 0,
                francis: num(p[F.francis]) > 0,
            },
        };
    });

    return { online, device, readings, history };
}
