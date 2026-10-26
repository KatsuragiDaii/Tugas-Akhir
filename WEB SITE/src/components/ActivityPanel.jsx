import { createMemo, createSignal, For } from "solid-js";
import ParameterCard from "~/components/ParameterCard";
import ActivityChart from "~/components/chart/ActivityChart";
import { ChevronDownIcon, DownloadIcon, ParamIcon } from "~/components/icons";
import { downloadActivityCsv } from "~/lib/activity-export";

// Jumlah titik yang digambar di grafik; seluruh riwayat tetap ikut di export CSV
const CHART_POINTS = 30;

// Satu angka desimal; nilai tak valid ditampilkan 0.0
const format = (n) => (Number.isFinite(n) ? n : 0).toFixed(1);

// Enam kartu parameter + grafik "Activity" (dengan pilihan parameter dan export CSV).
// Dipakai halaman PLTS dan PLTMH; datanya pembacaan live dari alat, bukan dari kontrol simulator.
//
// props.parameters   daftar parameter { key, label, unit, chartUnit, icon } (lihat json/*-parameter-json.jsx)
// props.defaultKey   parameter yang dipilih di grafik saat halaman dibuka
// props.readings     fungsi () => { [key]: angka } nilai terbaru, untuk kartu
// props.history      fungsi () => [{ t, [key]: angka }] riwayat, untuk grafik dan CSV
// props.title        judul grafik, mis. "PLTS Activity"
// props.ariaLabel    label area ini untuk pembaca layar
// props.selectId     id dropdown parameter grafik
// props.filePrefix   awalan nama file CSV, mis. "plts-activity"
export default function ActivityPanel(props) {

  const [selected, setSelected] = createSignal(props.defaultKey);

  const metric = () => props.parameters.find((p) => p.key === selected()) || props.parameters[0];

  const series = createMemo(() =>
    props
      .history()
      .slice(-CHART_POINTS)
      .map((point) => ({ x: point.t, y: Math.round(point[metric().key] * 100) / 100 }))
  );

  return (
    <section class="flex flex-col gap-4" aria-label={props.ariaLabel}>

      <div class="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <For each={props.parameters}>
          {(p) => (
            <ParameterCard
              label={p.label}
              value={format(props.readings()[p.key])}
              unit={p.unit}
              icon={<ParamIcon name={p.icon} class="h-9 w-9 sm:h-16 sm:w-16" />}
            />
          )}
        </For>
      </div>

      <div class="rounded-2xl border border-sisgrid-line bg-white px-5 py-4 font-poppins">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-lg font-bold text-sisgrid-ink">{props.title}</h2>

          <div class="flex items-center gap-2">
            <button
              type="button"
              disabled={props.history().length === 0}
              title={props.history().length === 0 ? "Belum ada data untuk diexport" : "Unduh semua parameter sebagai file CSV"}
              onClick={() => downloadActivityCsv(props.parameters, props.history(), props.filePrefix)}
              class="inline-flex items-center gap-1.5 rounded-md border border-sisgrid px-3 py-1.5 text-xs font-semibold text-sisgrid transition-colors hover:bg-sisgrid hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sisgrid disabled:cursor-not-allowed disabled:border-sisgrid-line disabled:text-gray-400 disabled:hover:bg-transparent disabled:hover:text-gray-400"
            >
              <DownloadIcon class="h-3.5 w-3.5" />
              Export CSV
            </button>

            <div class="relative">
              <label for={props.selectId} class="sr-only">Parameter grafik</label>
              <select
                id={props.selectId}
                class="cursor-pointer appearance-none rounded-md border border-sisgrid-line bg-white py-1.5 pl-3 pr-8 text-xs text-sisgrid-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sisgrid"
                value={selected()}
                onChange={(event) => setSelected(event.currentTarget.value)}
              >
                <For each={props.parameters}>
                  {(p) => (
                    <option value={p.key} selected={p.key === selected()}>
                      {p.label}
                    </option>
                  )}
                </For>
              </select>
              <ChevronDownIcon class="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-sisgrid-ink" />
            </div>
          </div>
        </div>

        <p class="mt-2 text-xs font-medium text-sisgrid">{metric().chartUnit}</p>
        <ActivityChart series={series()} name={metric().label} unit={metric().chartUnit} height={200} />
        <div class="flex items-center justify-between gap-3 text-xs">
          <p class="text-gray-500" data-testid="record-count">
            {props.history().length === 0
              ? "Belum ada data dari alat"
              : `${props.history().length} data tercatat sejak halaman ini dibuka`}
          </p>
          <p class="font-medium text-sisgrid">Time</p>
        </div>
      </div>
    </section>
  );
}
