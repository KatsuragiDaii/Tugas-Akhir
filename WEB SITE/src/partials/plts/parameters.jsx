import { createMemo, createSignal, For } from "solid-js";
import ParameterCard from "~/components/ParameterCard";
import PltsActivityChart from "~/components/chart/PltsActivityChart";
import { ChevronDownIcon, ParamIcon } from "~/components/icons";
import { DEFAULT_PARAMETER, PLTS_PARAMETERS } from "~/json/plts-parameter-json";
import { createPltsReadings } from "~/lib/plts-readings";

// Satu angka desimal; nilai tak valid ditampilkan 0.0
const format = (n) => (Number.isFinite(n) ? n : 0).toFixed(1);

// Enam kartu parameter dan grafik "PLTS Activity" di bawah simulator halaman /plts.
// Datanya pembacaan live dari alat PLTS PV; bukan dari slider simulator.
export default function PltsParameters() {

  const { readings, history } = createPltsReadings();
  const [selected, setSelected] = createSignal(DEFAULT_PARAMETER);

  const metric = () => PLTS_PARAMETERS.find((p) => p.key === selected()) || PLTS_PARAMETERS[0];

  const series = createMemo(() =>
    history().map((point) => ({ x: point.t, y: Math.round(point[metric().key] * 100) / 100 }))
  );

  return (
    <section class="flex flex-col gap-4" aria-label="Parameter PLTS">

      <div class="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <For each={PLTS_PARAMETERS}>
          {(p) => (
            <ParameterCard
              label={p.label}
              value={format(readings()[p.key])}
              unit={p.unit}
              icon={<ParamIcon name={p.icon} class="h-9 w-9 sm:h-16 sm:w-16" />}
            />
          )}
        </For>
      </div>

      <div class="rounded-2xl border border-sisgrid-line bg-white px-5 py-4 font-poppins">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-lg font-bold text-sisgrid-ink">PLTS Activity</h2>

          <div class="relative">
            <label for="plts-activity-metric" class="sr-only">Parameter grafik</label>
            <select
              id="plts-activity-metric"
              class="cursor-pointer appearance-none rounded-md border border-sisgrid-line bg-white py-1.5 pl-3 pr-8 text-xs text-sisgrid-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sisgrid"
              value={selected()}
              onChange={(event) => setSelected(event.currentTarget.value)}
            >
              <For each={PLTS_PARAMETERS}>
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

        <p class="mt-2 text-xs font-medium text-sisgrid">{metric().chartUnit}</p>
        <PltsActivityChart series={series()} name={metric().label} unit={metric().chartUnit} height={200} />
        <p class="text-right text-xs font-medium text-sisgrid">Time</p>
      </div>
    </section>
  );
}
