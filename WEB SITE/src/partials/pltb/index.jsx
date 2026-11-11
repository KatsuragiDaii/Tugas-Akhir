import { createSignal } from "solid-js";
import PageHeader from "~/components/PageHeader";
import { WindIcon } from "~/components/icons";
import Simulator3D from "~/components/simulator/Simulator3D";
import SimulatorFallbackWind from "~/components/simulator/SimulatorFallbackWind";
import { WIND_CAMERA, createWindModel } from "~/components/simulator/wind-model";
import SpeedControl from "~/components/control/SpeedControl";
import ActivityPanel from "~/components/ActivityPanel";
import { UseAuthCtx } from "~/context/auth.context";
import { UseDataCtx } from "~/context/data.context";
import { CONTROL_IDS, PLTB_PARTS } from "~/json/pltb-parts-json";
import { DEFAULT_PARAMETER, PLTB_PARAMETERS } from "~/json/pltb-parameter-json";
import { PLTB_TAG } from "~/json/pltb-tag-json";
import { SOCKET_TAG } from "~/json/socket-tag-json";
import { focusControl } from "~/lib/focus-control";
import { FAN_MAX_STEP, createPltbLive } from "~/lib/pltb-live";

// Putaran turbin (RPM) yang dianggap "berputar penuh" di model 3D. Hanya mengatur secepat apa
// turbin 3D berputar saat alat online; angka parameter tetap apa adanya dari alat.
const TURBINE_RPM_FULL = 400;

// Halaman /pltb: simulator PLTB di kiri, kontrol kipas di kanan, parameter dan grafik di bawahnya.
//
// Kontrol punya dua mode, tergantung apakah alat sedang mengirim data:
//  - alat online     : tombol mengirim perintah ke alat (sama seperti halaman lama), dan model 3D
//                      serta tampilan tombol mengikuti keadaan yang dilaporkan alat
//  - alat belum kirim: kontrol hanya mengubah simulasi 3D, tidak ada perintah yang dikirim
export default function ContentPLTB() {

  const { auth } = UseAuthCtx();
  const { command } = UseDataCtx();
  const live = createPltbLive();

  // Langkah kipas di mode simulasi (0..FAN_MAX_STEP)
  const [simFan, setSimFan] = createSignal(0);

  // Keadaan yang ditampilkan: dari alat bila online, kalau tidak dari simulasi
  const fanStep = () => (live.online() ? Math.round(live.device().fanStep) : simFan());
  const fanFraction = () => fanStep() / FAN_MAX_STEP;
  // Turbin mengikuti putaran terukur bila alat online; di simulasi ia mengikuti kipas
  const turbineFraction = () =>
    live.online() ? Math.min(1, Math.max(0, live.readings().rpm / TURBINE_RPM_FULL)) : fanFraction();

  const changeFan = (direction) => {
    if (live.online()) {
      // Perintah ke alat berupa "tekan" (nilai selalu "1"): alat sendiri yang menaikkan/menurunkan langkahnya
      command(
        SOCKET_TAG.pltb,
        { tag: direction > 0 ? PLTB_TAG.command.fanUp : PLTB_TAG.command.fanDown, value: "1" },
        auth().token
      );
    } else {
      setSimFan((step) => Math.min(FAN_MAX_STEP, Math.max(0, step + direction)));
    }
  };

  return (
    <div class="font-poppins text-sisgrid-ink animate-in fade-in duration-500 flex flex-col gap-5 px-2 py-5 sm:px-6">

      <PageHeader
        title="Pembangkit Listrik Tenaga Bayu"
        icon={<WindIcon class="w-11 h-11 lg:w-14 lg:h-14" />}
      />

      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,342px)]">

        <section class="rounded-3xl border-2 border-sisgrid-line bg-white p-6" aria-labelledby="sim-title">
          <h2 id="sim-title" class="text-2xl font-bold">Simulator 3D</h2>
          <div class="mt-3">
            <Simulator3D
              class="h-[340px] sm:h-[420px]"
              createModel={createWindModel}
              camera={WIND_CAMERA}
              parts={PLTB_PARTS}
              ariaLabel="Model 3D simulator PLTB"
              state={{ fan: fanFraction(), turbine: turbineFraction() }}
              fallback={() => (
                <SimulatorFallbackWind
                  class="absolute inset-0 h-full w-full p-2"
                  fan={fanFraction()}
                  turbine={turbineFraction()}
                />
              )}
              onSelect={(part) => focusControl(CONTROL_IDS[part?.control])}
            />
          </div>
        </section>

        <section class="flex flex-col gap-4 rounded-3xl border-2 border-sisgrid-line bg-white p-6" aria-labelledby="ctl-title">
          <h2 id="ctl-title" class="text-[26px] font-bold leading-tight">Kontrol PLTB</h2>

          <p
            class="flex items-start gap-2 rounded-lg bg-sisgrid-bg px-3 py-2 text-xs leading-snug text-gray-700"
            role="status"
            data-testid="mode-note"
            data-mode={live.online() ? "alat" : "simulasi"}
          >
            <span
              class={`mt-[3px] h-2.5 w-2.5 shrink-0 rounded-full ${live.online() ? "bg-emerald-500" : "bg-gray-400"}`}
              aria-hidden="true"
            />
            {live.online()
              ? "Terhubung ke alat. Tombol mengirim perintah ke alat, dan model 3D mengikuti keadaan alat."
              : "Mode simulasi: alat belum mengirim data. Kontrol hanya mengubah model 3D dan tidak mengirim perintah ke alat."}
          </p>

          <SpeedControl
            id={CONTROL_IDS.fan}
            decreaseLabel="Kurangi kecepatan kipas"
            increaseLabel="Tambah kecepatan kipas"
            label="Fan Speed Control"
            valueText={`Step ${fanStep()} / ${FAN_MAX_STEP}`}
            percent={fanFraction() * 100}
            minDisabled={!live.online() && simFan() === 0}
            maxDisabled={!live.online() && simFan() === FAN_MAX_STEP}
            onDecrease={() => changeFan(-1)}
            onIncrease={() => changeFan(1)}
          />

          <button
            type="button"
            onClick={() => setSimFan(0)}
            disabled={live.online()}
            title={live.online() ? "Hanya untuk mode simulasi; saat terhubung ke alat, atur lewat tombol di atas" : undefined}
            class="rounded-lg bg-sisgrid-maroon px-4 py-3 text-[15px] font-bold text-white transition hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sisgrid-maroon disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
          >
            Reset Simulasi
          </button>
        </section>
      </div>

      {/* Parameter live dari alat (kartu + grafik); terpisah dari kontrol di atas */}
      <ActivityPanel
        parameters={PLTB_PARAMETERS}
        defaultKey={DEFAULT_PARAMETER}
        readings={live.readings}
        history={live.history}
        title="PLTB Activity"
        ariaLabel="Parameter PLTB"
        selectId="pltb-activity-metric"
        filePrefix="pltb-activity"
      />
    </div>
  );
}
