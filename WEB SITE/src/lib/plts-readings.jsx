import { createEffect, createMemo, createSignal } from "solid-js";
import { UseDataCtx } from "~/context/data.context";
import { SOCKET_TAG } from "~/json/socket-tag-json";
import { PV_TAG } from "~/json/pv-tag-json";

// Jarak minimal antar titik riwayat dan jumlah titik yang disimpan untuk grafik
const SAMPLE_MS = 2000;
const MAX_POINTS = 30;

// Data dari alat bisa berupa angka atau string ("12.50"); nilai tak valid dianggap 0
const num = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

// Pembacaan live PLTS PV dari socket (sumber yang sama dengan halaman /plts/pv).
// Harus dipanggil di dalam komponen (memakai context).
//
//   readings() -> { temperature, humidity, light, voltage, current, power }
//                 semuanya 0 selama belum ada data dari alat; power = voltage x current
//   history()  -> [{ t, ...readings }] urut waktu. Satu titik per pesan baru, minimal
//                 SAMPLE_MS antar titik, maksimal MAX_POINTS. Kosong selama belum ada
//                 data, dan berhenti bertambah bila alat berhenti mengirim.
export function createPltsReadings() {
    const { data } = UseDataCtx();

    // Berubah hanya saat ada pesan PV baru (objek payload baru dari socket.context)
    const payload = createMemo(() => data() && data()[SOCKET_TAG.pltsPV]);

    const readings = createMemo(() => {
        const p = payload() || {};
        const voltage = num(p[PV_TAG.field.voltage]);
        const current = num(p[PV_TAG.field.current]);
        return {
            temperature: num(p[PV_TAG.field.temperature]),
            humidity: num(p[PV_TAG.field.humidity]),
            light: num(p[PV_TAG.field.pv_lux]),
            voltage,
            current,
            power: voltage * current,
        };
    });

    const [history, setHistory] = createSignal([]);

    createEffect(() => {
        if (!payload()) return;
        const point = { t: Date.now(), ...readings() };
        setHistory((prev) => {
            const last = prev[prev.length - 1];
            if (last && point.t - last.t < SAMPLE_MS) return prev;
            return [...prev, point].slice(-MAX_POINTS);
        });
    });

    return { readings, history };
}
