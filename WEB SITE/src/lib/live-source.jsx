import { createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { UseDataCtx } from "~/context/data.context";

// Jarak minimal antar titik riwayat dan jumlah titik yang disimpan (3600 titik x 2 detik =
// sekitar 2 jam). Grafik hanya menampilkan sebagian terakhir; sisanya untuk export CSV.
const SAMPLE_MS = 2000;
const RECORD_LIMIT = 3600;

// Alat dianggap offline bila tidak ada pesan selama selang ini
const ONLINE_MS = 8000;

// Data dari alat bisa berupa angka atau string; nilai tak valid dianggap 0
export const num = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

// Pembacaan live satu alat dari socket. Dipakai halaman PLTMH dan PLTB.
// Harus dipanggil di dalam komponen (memakai context).
//
//   group      kunci socket alat, mis. SOCKET_TAG.pltmh
//   toReadings fungsi (payload) => { [key]: angka }. Payload berupa {} selama belum ada data,
//              jadi semua nilai harus jatuh ke 0 (pakai num()).
//
//   payload()  -> pesan terbaru dari alat, atau undefined selama belum ada
//   online()   -> true bila alat mengirim data dalam ONLINE_MS terakhir
//   readings() -> hasil toReadings dari pesan terbaru
//   history()  -> [{ t, ...readings }] urut waktu. Satu titik per pesan baru, minimal
//                 SAMPLE_MS antar titik, maksimal RECORD_LIMIT (yang terlama dibuang).
//                 Kosong selama belum ada data, dan berhenti bertambah bila alat berhenti
//                 mengirim. Hilang saat komponen dilepas (pindah halaman / refresh).
export function createLiveSource(group, toReadings) {
    const { data } = UseDataCtx();

    // Berubah hanya saat ada pesan baru (objek payload baru dari socket.context).
    // Untuk sebagian alat, nilai awalnya di data.context adalah fungsi (getter signal), bukan
    // objek: itu bukan data.
    const payload = createMemo(() => {
        const p = data() && data()[group];
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

    const readings = createMemo(() => toReadings(payload() || {}));

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

    return { payload, online, readings, history };
}
