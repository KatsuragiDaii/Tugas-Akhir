import { createEffect, createSignal, For, on } from "solid-js";
import { A } from "@solidjs/router";
import PageHeader from "~/components/PageHeader";
import { PowerIcon, SunIcon } from "~/components/icons";
import Simulator3D from "~/components/simulator/Simulator3D";
import SimulatorFallback from "~/components/simulator/SimulatorFallback";
import { PV_CAMERA, createPvModel } from "~/components/simulator/pv-model";
import SliderControl from "~/components/control/SliderControl";
import SimToggle from "~/components/control/SimToggle";
import SpeedControl from "~/components/control/SpeedControl";
import ActivityPanel from "~/components/ActivityPanel";
import { UseAuthCtx } from "~/context/auth.context";
import { UseDataCtx } from "~/context/data.context";
import { CONTROL_IDS, PLTS_PARTS } from "~/json/plts-parts-json";
import { DEFAULT_PARAMETER, PLTS_PARAMETERS } from "~/json/plts-parameter-json";
import { pltsPraktikum } from "~/json/plts-praktikum-json";
import { PV_TAG } from "~/json/pv-tag-json";
import { SOCKET_TAG } from "~/json/socket-tag-json";
import { focusControl } from "~/lib/focus-control";
import { DIMMER_MAX, TILT_MAX, createPltsLive } from "~/lib/plts-live";

// Nilai awal simulasi; juga dipakai tombol "Reset Parameter"
const DEFAULTS = { tilt: 40, intensity: 800, fan: false, heater: false };

// Intensitas cahaya di simulasi berskala 0..1200 W/m². Dimmer alat berskala 0..100 %, jadi saat alat
// online model 3D memakai 100 % = 1200 W/m². Ini skala tampilan model, bukan hasil kalibrasi lampu.
const MODEL_INTENSITY_MAX = 1200;

// Tombol "Trigger Lampu" menekan tombol lampu di alat selama selang ini, lalu melepasnya
const TRIGGER_MS = 2000;

// Setelah slider intensitas dilepas, nilai yang digeser tetap ditampilkan selama selang ini untuk
// memberi waktu alat melaporkan nilai barunya; sesudah itu slider kembali mengikuti alat
const DRAFT_HOLD_MS = 2500;

// Halaman /plts: simulator PLTS di kiri, kontrol di kanan, parameter dan grafik di bawahnya.
// Halaman ini juga menggantikan halaman PV (/plts/pv) yang dulu terpisah: semua kontrol alat PV
// (fan, heater, servo kemiringan, dimmer lampu, trigger lampu) ada di sini.
//
// Kontrol punya dua mode, tergantung apakah alat sedang mengirim data:
//  - alat online     : kontrol mengirim perintah ke alat (sama seperti halaman PV lama), dan model 3D
//                      serta tampilan kontrol mengikuti keadaan yang dilaporkan alat
//  - alat belum kirim: kontrol hanya mengubah simulasi 3D, tidak ada perintah yang dikirim
export default function ContentPLTS() {

  const { auth } = UseAuthCtx();
  const { command } = UseDataCtx();
  const live = createPltsLive();
  const online = live.online;

  // Keadaan simulasi (dipakai saat alat belum mengirim data)
  const [simTilt, setSimTilt] = createSignal(DEFAULTS.tilt);
  const [simIntensity, setSimIntensity] = createSignal(DEFAULTS.intensity);
  const [simFan, setSimFan] = createSignal(DEFAULTS.fan);
  const [simHeater, setSimHeater] = createSignal(DEFAULTS.heater);

  // Nilai slider intensitas yang sedang digeser pengguna (dalam %), hanya saat alat online
  const [draft, setDraft] = createSignal(null);
  let draftTimer;
  const clearDraftLater = () => {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => setDraft(null), DRAFT_HOLD_MS);
  };
  createEffect(on(online, () => {
    clearTimeout(draftTimer);
    setDraft(null);
  }, { defer: true }));

  // Keadaan yang ditampilkan: dari alat bila online, kalau tidak dari simulasi
  const tilt = () => (online() ? live.device().tilt : simTilt());
  const fan = () => (online() ? live.device().fan : simFan());
  const heater = () => (online() ? live.device().heater : simHeater());
  const lampPercent = () => draft() ?? live.device().dimmer;
  const intensity = () => (online() ? (lampPercent() / DIMMER_MAX) * MODEL_INTENSITY_MAX : simIntensity());

  const send = (tag, value) => command(SOCKET_TAG.pltsPV, { tag, value: String(value) }, auth().token);

  const changeFan = (next) => (online() ? send(PV_TAG.command.fan, next ? "1" : "0") : setSimFan(next));
  const changeHeater = (next) => (online() ? send(PV_TAG.command.heater, next ? "1" : "0") : setSimHeater(next));

  // Servo kemiringan di alat bergerak dengan "tekan": perintah naik/turun bernilai "1", alat yang
  // menentukan besar langkahnya dan melaporkan sudut barunya
  const tiltStep = (direction) => send(direction > 0 ? PV_TAG.command.servoUp : PV_TAG.command.servoDown, "1");

  const onLampInput = (value) => {
    if (online()) {
      setDraft(value);
      clearTimeout(draftTimer);
    } else {
      setSimIntensity(value);
    }
  };
  // Perintah dimmer dikirim sekali saat slider dilepas, bukan tiap geseran
  const onLampCommit = (value) => {
    if (!online()) return;
    send(PV_TAG.command.dimmer, value);
    clearDraftLater();
  };

  // Trigger Lampu: tekan tombol lampu di alat selama TRIGGER_MS lalu lepas. Pelepasan tidak
  // dibatalkan saat halaman ditutup, supaya tombol di alat tidak tertahan.
  const [triggering, setTriggering] = createSignal(false);
  const triggerLamp = () => {
    const token = auth().token;
    setTriggering(true);
    command(SOCKET_TAG.pltsPV, { tag: PV_TAG.command.button, value: "1" }, token);
    setTimeout(() => {
      command(SOCKET_TAG.pltsPV, { tag: PV_TAG.command.button, value: "0" }, token);
      setTriggering(false);
    }, TRIGGER_MS);
  };

  const reset = () => {
    setSimTilt(DEFAULTS.tilt);
    setSimIntensity(DEFAULTS.intensity);
    setSimFan(DEFAULTS.fan);
    setSimHeater(DEFAULTS.heater);
  };

  return (
    <div class="font-poppins text-sisgrid-ink animate-in fade-in duration-500 flex flex-col gap-5 px-2 py-5 sm:px-6">

      <PageHeader
        title="Pembangkit Listrik Tenaga Surya"
        icon={<SunIcon class="w-11 h-11 lg:w-14 lg:h-14" />}
      />

      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,342px)]">

        <section class="rounded-3xl border-2 border-sisgrid-line bg-white p-6" aria-labelledby="sim-title">
          <h2 id="sim-title" class="text-2xl font-bold">Simulator 3D</h2>
          <div class="mt-3">
            <Simulator3D
              class="h-[340px] sm:h-[420px]"
              createModel={createPvModel}
              camera={PV_CAMERA}
              parts={PLTS_PARTS}
              ariaLabel="Model 3D simulator PLTS"
              state={{ tilt: tilt(), intensity: intensity(), fan: fan(), heater: heater() }}
              fallback={() => (
                <SimulatorFallback
                  class="absolute inset-0 h-full w-full p-2"
                  tilt={tilt()}
                  intensity={intensity()}
                  fan={fan()}
                  heater={heater()}
                />
              )}
              onSelect={(part) => focusControl(CONTROL_IDS[part?.control])}
            />
          </div>
        </section>

        <section class="flex flex-col gap-4 rounded-3xl border-2 border-sisgrid-line bg-white p-6" aria-labelledby="ctl-title">
          <h2 id="ctl-title" class="text-[26px] font-bold leading-tight">Kontrol Simulator</h2>

          <p
            class="flex items-start gap-2 rounded-lg bg-sisgrid-bg px-3 py-2 text-xs leading-snug text-gray-700"
            role="status"
            data-testid="mode-note"
            data-mode={online() ? "alat" : "simulasi"}
          >
            <span
              class={`mt-[3px] h-2.5 w-2.5 shrink-0 rounded-full ${online() ? "bg-emerald-500" : "bg-gray-400"}`}
              aria-hidden="true"
            />
            {online()
              ? "Terhubung ke alat. Kontrol mengirim perintah ke alat, dan model 3D mengikuti keadaan alat."
              : "Mode simulasi: alat belum mengirim data. Kontrol hanya mengubah model 3D dan tidak mengirim perintah ke alat."}
          </p>

          {/* Kemiringan: alat memakai servo yang digerakkan naik/turun; simulasi memakai slider */}
          {online() ? (
            <SpeedControl
              id={CONTROL_IDS.tilt}
              decreaseLabel="Turunkan kemiringan panel"
              increaseLabel="Naikkan kemiringan panel"
              label="Kemiringan Panel"
              valueText={`${Math.round(tilt())}°`}
              percent={(tilt() / TILT_MAX) * 100}
              onDecrease={() => tiltStep(-1)}
              onIncrease={() => tiltStep(1)}
            />
          ) : (
            <SliderControl id={CONTROL_IDS.tilt} label="Kemiringan Panel" unit="°" min={0} max={TILT_MAX} value={simTilt()} onInput={setSimTilt} />
          )}

          <SliderControl
            id={CONTROL_IDS.light}
            label="Intensitas Cahaya"
            unit={online() ? "%" : "W/m²"}
            min={0}
            max={online() ? DIMMER_MAX : MODEL_INTENSITY_MAX}
            step={online() ? 1 : 50}
            value={online() ? lampPercent() : simIntensity()}
            onInput={onLampInput}
            onCommit={onLampCommit}
          />

          <button
            type="button"
            onClick={triggerLamp}
            disabled={!online() || triggering() || lampPercent() < 1}
            title={
              !online()
                ? "Hanya tersedia saat terhubung ke alat"
                : lampPercent() < 1
                  ? "Naikkan intensitas cahaya lebih dulu"
                  : undefined
            }
            class="-mt-1 flex items-center justify-center gap-2 rounded-lg border-2 border-sisgrid px-4 py-2.5 text-[15px] font-bold text-sisgrid transition hover:bg-sisgrid hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sisgrid disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-sisgrid"
          >
            <PowerIcon class="h-5 w-5" />
            {triggering() ? "Memicu lampu…" : "Trigger Lampu"}
          </button>

          <SimToggle id={CONTROL_IDS.fan} label="Fan/Kipas" checked={fan()} onChange={changeFan} />
          <SimToggle id={CONTROL_IDS.heater} label="Heater/Pemanas" checked={heater()} onChange={changeHeater} />

          <button
            type="button"
            onClick={reset}
            disabled={online()}
            title={online() ? "Hanya untuk mode simulasi; saat terhubung ke alat, atur lewat kontrol di atas" : undefined}
            class="rounded-lg bg-sisgrid-maroon px-4 py-3 text-[15px] font-bold text-white transition hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sisgrid-maroon disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
          >
            Reset Parameter
          </button>
        </section>
      </div>

      {/* Parameter live dari alat (kartu + grafik); terpisah dari kontrol di atas */}
      <ActivityPanel
        parameters={PLTS_PARAMETERS}
        defaultKey={DEFAULT_PARAMETER}
        readings={live.readings}
        history={live.history}
        title="PLTS Activity"
        ariaLabel="Parameter PLTS"
        selectId="plts-activity-metric"
        filePrefix="plts-activity"
      />

      {/* Praktikum PLTS lain dengan alat sungguhan; praktikum PV sudah ada di halaman ini */}
      <nav aria-label="Praktikum PLTS" class="flex flex-wrap items-center gap-2 text-sm">
        <span class="font-medium text-gray-600">Buka praktikum:</span>
        <For each={pltsPraktikum.filter((item) => item.url !== "/plts")}>
          {(item) => (
            <A
              href={item.url}
              title={item.description}
              class="rounded-full border-2 border-sisgrid px-4 py-1 font-semibold text-sisgrid transition-colors hover:bg-sisgrid hover:text-white"
            >
              {item.title}
            </A>
          )}
        </For>
      </nav>
    </div>
  );
}
