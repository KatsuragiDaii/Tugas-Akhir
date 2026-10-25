import { createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { UseDataCtx } from "~/context/data.context";
import { SOCKET_TAG } from "~/json/socket-tag-json";
import { PLTMH_TAG } from "~/json/pltmh-tag-json";

// Jarak minimal antar titik riwayat dan jumlah titik yang disimpan (3600 titik x 2 detik =
// sekitar 2 jam). Grafik hanya menampilkan sebagian terakhir; sisanya untuk export CSV.
const SAMPLE_MS = 2000;
const RECORD_LIMIT = 3600;

// Alat dianggap offline bila tidak ada pesan PLTMH selama selang ini
const ONLINE_MS = 8000;

// Kecepatan pompa dari alat berskala 0..10000 = 0..50 Hz (rumus yang sama dengan halaman lama)
export const PUMP_RAW_MAX = 10000;
export const PUMP_MAX_HZ = 50;

// Data dari alat bisa berupa angka atau string; nilai tak valid dianggap 0
const num = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

// Pembacaan live PLTMH dari socket (sumber yang sama dengan halaman PLTMH sebelumnya).
// Harus dipanggil di dalam komponen (memakai context).
//
//   online()   -> true bila alat mengirim data dalam ONLINE_MS terakhir
//   device()   -> { pumpFraction: 0..1, pumpHz, turbines: { pelton, crossFlow, kaplan, francis: bool } }
//                 keadaan pompa dan solenoid turbin yang dilaporkan alat (0 / false selama belum ada data)
//   readings() -> { flow, voltage, current, pressure, rpm, power }
//                 semuanya 0 selama belum ada data; power = voltage x current
//   history()  -> [{ t, ...readings }] urut waktu. Satu titik per pesan baru, minimal
//                 SAMPLE_MS antar titik, maksimal RECORD_LIMIT (yang terlama dibuang).
//                 Kosong selama belum ada data, dan berhenti bertambah bila alat berhenti
//                 mengirim. Hilang saat komponen dilepas (pindah halaman / refresh).
export function createPltmhLive() {
    const { data } = UseDataCtx();
    const F = PLTMH_TAG.field;

    // Berubah hanya saat ada pesan PLTMH baru (objek payload baru dari socket.context).
    // Nilai awalnya di data.context adalah fungsi (getter signal), bukan objek: itu bukan data.
    const payload = createMemo(() => {
        const p = data() && data()[SOCKET_TAG.pltmh];
        return p && typeof p === "object" ? p : undefined;
    });

    const [lastSeen, setLastSeen] = createSignal(0);
    const [now, setNow] = createSignal(Date.now());
    createEffect(() => {
        if (payload()) setLastSeen(Date.now());
    });
    onMount(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        onCleanup(() => clearInterval(timer));
    });
    const online = createMemo(() => lastSeen() > 0 && now() - lastSeen() < ONLINE_MS);

    const readings = createMemo(() => {
        const p = payload() || {};
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

    const [history, setHistory] = createSignal([]);
    createEffect(() => {
        if (!payload()) return;
        const point = { t: Date.now(), ...readings() };
        setHistory((prev) => {
            const last = prev[prev.length - 1];
            if (last && point.t - last.t < SAMPLE_MS) return prev;
            return [...prev, point].slice(-RECORD_LIMIT);
        });
    });

    return { online, device, readings, history };
}
