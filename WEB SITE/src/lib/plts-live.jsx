import { createMemo } from "solid-js";
import { SOCKET_TAG } from "~/json/socket-tag-json";
import { PV_TAG } from "~/json/pv-tag-json";
import { createLiveSource, num } from "~/lib/live-source";

// Batas yang dipakai model 3D dan tampilan kontrol
export const TILT_MAX = 90;        // derajat; 0 = panel mendatar, 90 = tegak
export const DIMMER_MAX = 100;     // dimmer lampu alat berskala 0..100 (%)

const F = PV_TAG.field;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

// Pembacaan live PLTS PV dari socket (sumber yang sama dengan halaman PV lama, yang kini menyatu
// di halaman /plts). Harus dipanggil di dalam komponen (memakai context).
//
//   online()   -> true bila alat mengirim data dalam 8 detik terakhir
//   device()   -> keadaan kontrol yang dilaporkan alat:
//                 { tilt: 0..90 (derajat), dimmer: 0..100 (%), fan: bool, heater: bool }
//                 semuanya 0 / false selama belum ada data
//   readings() -> { temperature, humidity, light, voltage, current, power }
//                 semuanya 0 selama belum ada data; power = voltage x current
//   history()  -> riwayat pembacaan untuk grafik dan CSV, lihat createLiveSource
export function createPltsLive() {

    const { payload, online, readings, history } = createLiveSource(SOCKET_TAG.pltsPV, (p) => {
        const voltage = num(p[F.voltage]);
        const current = num(p[F.current]);
        return {
            temperature: num(p[F.temperature]),
            humidity: num(p[F.humidity]),
            light: num(p[F.pv_lux]),
            voltage,
            current,
            power: voltage * current,
        };
    });

    const device = createMemo(() => {
        const p = payload() || {};
        return {
            tilt: clamp(num(p[F.tiltServo]), 0, TILT_MAX),
            dimmer: clamp(num(p[F.dimmer]), 0, DIMMER_MAX),
            fan: num(p[F.fan]) > 0,
            heater: num(p[F.heater]) > 0,
        };
    });

    return { online, device, readings, history };
}
