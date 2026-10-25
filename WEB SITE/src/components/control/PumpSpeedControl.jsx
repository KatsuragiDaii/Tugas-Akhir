// Kontrol kecepatan pompa bergaya SISGRID: label, tombol kurang/tambah bulat di kiri-kanan angka
// kecepatan, dan batang kemajuan di bawahnya.
//
// props.label        teks label
// props.valueText    kecepatan yang ditampilkan, mis. "25.00 Hz"
// props.percent      0-100, panjang batang kemajuan
// props.onDecrease   dipanggil saat tombol kurang diklik
// props.onIncrease   dipanggil saat tombol tambah diklik
// props.minDisabled  true bila tidak bisa dikurangi lagi (mis. kecepatan sudah 0 di mode simulasi)
// props.maxDisabled  true bila tidak bisa ditambah lagi
// props.id           id tombol tambah (opsional); dipakai Simulator3D untuk memfokuskan kontrol ini
export default function PumpSpeedControl(props) {

  const round =
    "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-sisgrid transition hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white";

  return (
    <div class="rounded-lg bg-sisgrid px-4 py-3 font-poppins text-white" data-control-box>
      <p class="text-center text-[15px] font-bold">{props.label}</p>

      <div class="mt-2 flex items-center justify-between gap-3">
        <button
          type="button"
          class={round}
          aria-label="Kurangi kecepatan pompa"
          disabled={props.minDisabled}
          onClick={() => props.onDecrease()}
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        </button>

        <p class="text-center text-2xl font-bold tabular-nums" aria-live="polite" data-testid="pump-value">
          {props.valueText}
        </p>

        <button
          id={props.id}
          type="button"
          class={round}
          aria-label="Tambah kecepatan pompa"
          disabled={props.maxDisabled}
          onClick={() => props.onIncrease()}
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true">
            <path d="M5 12h14M12 5v14" />
          </svg>
        </button>
      </div>

      <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-white/25" aria-hidden="true">
        <div class="h-full rounded-full bg-emerald-400 transition-[width]" style={{ width: `${props.percent}%` }} />
      </div>
    </div>
  );
}
