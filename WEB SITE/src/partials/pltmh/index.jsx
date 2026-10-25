import { createSignal } from "solid-js";
import PageHeader from "~/components/PageHeader";
import { DropIcon } from "~/components/icons";
import Simulator3D from "~/components/simulator/Simulator3D";
import SimulatorFallbackHydro from "~/components/simulator/SimulatorFallbackHydro";
import { HYDRO_CAMERA, createHydroModel } from "~/components/simulator/hydro-model";
import PumpSpeedControl from "~/components/control/PumpSpeedControl";
import SimToggle from "~/components/control/SimToggle";
import ActivityPanel from "~/components/ActivityPanel";
import { UseAuthCtx } from "~/context/auth.context";
import { UseDataCtx } from "~/context/data.context";
import { CONTROL_IDS, PLTMH_PARTS } from "~/json/pltmh-parts-json";
import { DEFAULT_PARAMETER, PLTMH_PARAMETERS } from "~/json/pltmh-parameter-json";
import { PLTMH_TAG } from "~/json/pltmh-tag-json";
import { SOCKET_TAG } from "~/json/socket-tag-json";
import { focusControl } from "~/lib/focus-control";
import { PUMP_MAX_HZ, createPltmhLive } from "~/lib/pltmh-live";

// Pompa di mode simulasi: 10 langkah dari 0 sampai kecepatan penuh (50 Hz), 5 Hz per langkah
const PUMP_STEPS = 10;

const TURBINE_BUTTONS = [
  { key: "pelton", label: "Pelton", command: PLTMH_TAG.command.pelton },
  { key: "crossFlow", label: "Cross Flow", command: PLTMH_TAG.command.crossFlow },
  { key: "kaplan", label: "Kaplan", command: PLTMH_TAG.command.kaplan },
  { key: "francis", label: "Francis", command: PLTMH_TAG.command.francis },
];

const NO_TURBINE_ON = { pelton: false, crossFlow: false, kaplan: false, francis: false };

// Halaman /pltmh: simulator PLTMH di kiri, kontrol di kanan, parameter dan grafik di bawahnya.
//
// Kontrol punya dua mode, tergantung apakah alat sedang mengirim data:
//  - alat online     : tombol mengirim perintah ke alat (sama seperti halaman lama), dan model 3D
//                      serta tampilan tombol mengikuti keadaan yang dilaporkan alat
//  - alat belum kirim: kontrol hanya mengubah simulasi 3D, tidak ada perintah yang dikirim
export default function ContentPLTMH() {

  const { auth } = UseAuthCtx();
  const { command } = UseDataCtx();
  const live = createPltmhLive();

  // Keadaan mode simulasi
  const [simPump, setSimPump] = createSignal(0);
  const [simTurbines, setSimTurbines] = createSignal(NO_TURBINE_ON);

  // Keadaan yang ditampilkan: dari alat bila online, kalau tidak dari simulasi
  const pumpFraction = () => (live.online() ? live.device().pumpFraction : simPump() / PUMP_STEPS);
  const turbineOn = (key) => (live.online() ? live.device().turbines[key] : simTurbines()[key]);

  const send = (tag) => command(SOCKET_TAG.pltmh, { tag, value: "1" }, auth().token);

  const changePump = (direction) => {
    if (live.online()) send(direction > 0 ? PLTMH_TAG.command.pumpUp : PLTMH_TAG.command.pumpDown);
    else setSimPump((step) => Math.min(PUMP_STEPS, Math.max(0, step + direction)));
  };

  // Perintah ke alat berupa "tekan" (nilai selalu "1"): alat sendiri yang membalik keadaan solenoidnya
  const toggleTurbine = (button) => {
    if (live.online()) send(button.command);
    else setSimTurbines((state) => ({ ...state, [button.key]: !state[button.key] }));
  };

  const reset = () => {
    setSimPump(0);
    setSimTurbines(NO_TURBINE_ON);
  };

  return (
    <div class="font-poppins text-sisgrid-ink animate-in fade-in duration-500 flex flex-col gap-5 px-2 py-5 sm:px-6">

      <PageHeader
        title="Pembangkit Listrik Tenaga Mikro Hidro"
        icon={<DropIcon class="w-11 h-11 lg:w-14 lg:h-14" />}
      />

      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,342px)]">

        <section class="rounded-3xl border-2 border-sisgrid-line bg-white p-6" aria-labelledby="sim-title">
          <h2 id="sim-title" class="text-2xl font-bold">Simulator 3D</h2>
          <div class="mt-3">
            <Simulator3D
              class="h-[340px] sm:h-[420px]"
              createModel={createHydroModel}
              camera={HYDRO_CAMERA}
              parts={PLTMH_PARTS}
              ariaLabel="Model 3D simulator PLTMH"
              state={{
                pump: pumpFraction(),
                pelton: turbineOn("pelton"),
                crossFlow: turbineOn("crossFlow"),
                kaplan: turbineOn("kaplan"),
                francis: turbineOn("francis"),
              }}
              fallback={() => (
                <SimulatorFallbackHydro
                  class="absolute inset-0 h-full w-full p-2"
                  pump={pumpFraction()}
                  pelton={turbineOn("pelton")}
                  crossFlow={turbineOn("crossFlow")}
                  kaplan={turbineOn("kaplan")}
                  francis={turbineOn("francis")}
                />
              )}
              onSelect={(part) => focusControl(CONTROL_IDS[part?.control])}
            />
          </div>
        </section>

        <section class="flex flex-col gap-4 rounded-3xl border-2 border-sisgrid-line bg-white p-6" aria-labelledby="ctl-title">
          <h2 id="ctl-title" class="text-[26px] font-bold leading-tight">Kontrol PLTMH</h2>

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

          <PumpSpeedControl
            id={CONTROL_IDS.pump}
            label="Pump Speed Control"
            valueText={`${(pumpFraction() * PUMP_MAX_HZ).toFixed(2)} Hz`}
            percent={pumpFraction() * 100}
            minDisabled={!live.online() && simPump() === 0}
            maxDisabled={!live.online() && simPump() === PUMP_STEPS}
            onDecrease={() => changePump(-1)}
            onIncrease={() => changePump(1)}
          />

          {TURBINE_BUTTONS.map((button) => (
            <SimToggle
              id={CONTROL_IDS[button.key]}
              label={button.label}
              checked={turbineOn(button.key)}
              onChange={() => toggleTurbine(button)}
            />
          ))}

          <button
            type="button"
            onClick={reset}
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
        parameters={PLTMH_PARAMETERS}
        defaultKey={DEFAULT_PARAMETER}
        readings={live.readings}
        history={live.history}
        title="PLTMH Activity"
        ariaLabel="Parameter PLTMH"
        selectId="pltmh-activity-metric"
        filePrefix="pltmh-activity"
      />
    </div>
  );
}
