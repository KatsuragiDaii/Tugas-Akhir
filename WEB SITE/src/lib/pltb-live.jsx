import { createMemo } from "solid-js";
import { SOCKET_TAG } from "~/json/socket-tag-json";
import { PLTB_TAG } from "~/json/pltb-tag-json";
import { createLiveSource, num } from "~/lib/live-source";

// Kipas PLTB diatur dalam langkah 0..FAN_MAX_STEP (batas yang sama dengan input manual di
// FanSpeedControl: "Nilai tidak boleh lebih dari 10")
export const FAN_MAX_STEP = 10;

const F = PLTB_TAG.field;

// Pembacaan live PLTB dari socket (sumber yang sama dengan halaman PLTB sebelumnya).
// Harus dipanggil di dalam komponen (memakai context).
//
//   online()   -> true bila alat mengirim data dalam 8 detik terakhir
//   device()   -> { fanStep, fanFraction: 0..1 } langkah kipas yang dilaporkan alat (0 selama belum ada data)
//   readings() -> { windSpeed, voltage, current, rpm, power, fanStep }
//                 semuanya 0 selama belum ada data; voltage = nilai alat / 100 (sama dengan halaman lama);
//                 power = voltage x current
//   history()  -> riwayat pembacaan untuk grafik dan CSV, lihat createLiveSource
export function createPltbLive() {

    const { payload, online, readings, history } = createLiveSource(SOCKET_TAG.pltb, (p) => {
        const voltage = num(p[F.voltage]) / 100;
        const current = num(p[F.current]);
        return {
            windSpeed: num(p[F.windSpeed]),
            voltage,
            current,
            rpm: num(p[F.turbinRotation]),
            power: voltage * current,
            fanStep: num(p[F.fanStep]),
        };
    });

    const device = createMemo(() => {
        const fanStep = Math.min(FAN_MAX_STEP, Math.max(0, num((payload() || {})[F.fanStep])));
        return { fanStep, fanFraction: fanStep / FAN_MAX_STEP };
    });

    return { online, device, readings, history };
}
