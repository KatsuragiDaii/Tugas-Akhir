import { createSignal, For } from "solid-js";
import { A } from "@solidjs/router";
import PageHeader from "~/components/PageHeader";
import { SunIcon } from "~/components/icons";
import Simulator3D from "~/components/simulator/Simulator3D";
import SliderControl from "~/components/control/SliderControl";
import SimToggle from "~/components/control/SimToggle";
import { CONTROL_IDS } from "~/json/plts-parts-json";
import PltsParameters from "./parameters";
import { pltsPraktikum } from "~/json/plts-praktikum-json";

// Nilai awal simulator; juga dipakai tombol "Reset Parameter"
const DEFAULTS = { tilt: 40, intensity: 800, fan: false, heater: false };

// Saat bagian model 3D diklik, kontrol yang terkait difokuskan dan diberi penanda sesaat
// (lihat .ctl-flash di app.css). preventScroll: halaman tidak ikut bergulir.
const flashTimers = new WeakMap(); // satu pewaktu per kontrol, supaya klik berurutan tidak saling memotong

function focusControl(controlKey) {
  const element = controlKey ? document.getElementById(CONTROL_IDS[controlKey]) : null;
  if (!element) return;
  element.focus({ preventScroll: true });
  const box = element.closest("[data-control-box]");
  if (!box) return;
  window.clearTimeout(flashTimers.get(box));
  box.classList.remove("ctl-flash");
  void box.offsetWidth; // mulai ulang animasi bila diklik berurutan
  box.classList.add("ctl-flash");
  flashTimers.set(box, window.setTimeout(() => box.classList.remove("ctl-flash"), 1600));
}

// Halaman /plts: simulator PLTS di kiri, kontrol di kanan.
// Kontrol hanya mengatur simulasi di halaman ini. Belum ada perintah yang dikirim ke alat.
export default function ContentPLTS() {

  const [tilt, setTilt] = createSignal(DEFAULTS.tilt);
  const [intensity, setIntensity] = createSignal(DEFAULTS.intensity);
  const [fan, setFan] = createSignal(DEFAULTS.fan);
  const [heater, setHeater] = createSignal(DEFAULTS.heater);

  const reset = () => {
    setTilt(DEFAULTS.tilt);
    setIntensity(DEFAULTS.intensity);
    setFan(DEFAULTS.fan);
    setHeater(DEFAULTS.heater);
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
              tilt={tilt()}
              intensity={intensity()}
              fan={fan()}
              heater={heater()}
              onSelect={(part) => focusControl(part?.control)}
            />
          </div>
        </section>

        <section class="flex flex-col gap-4 rounded-3xl border-2 border-sisgrid-line bg-white p-6" aria-labelledby="ctl-title">
          <h2 id="ctl-title" class="text-[26px] font-bold leading-tight">Kontrol Simulator</h2>

          <SliderControl id={CONTROL_IDS.tilt} label="Kemiringan Panel" unit="°" min={0} max={90} value={tilt()} onInput={setTilt} />
          <SliderControl
            id={CONTROL_IDS.light}
            label="Intensitas Cahaya"
            unit="W/m²"
            min={0}
            max={1200}
            step={50}
            value={intensity()}
            onInput={setIntensity}
          />

          <SimToggle id={CONTROL_IDS.fan} label="Fan/Kipas" checked={fan()} onChange={setFan} />
          <SimToggle id={CONTROL_IDS.heater} label="Heater/Pemanas" checked={heater()} onChange={setHeater} />

          <button
            type="button"
            onClick={reset}
            class="rounded-lg bg-sisgrid-maroon px-4 py-3 text-[15px] font-bold text-white transition hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sisgrid-maroon"
          >
            Reset Parameter
          </button>
        </section>
      </div>

      {/* Parameter live dari alat (kartu + grafik); terpisah dari kontrol simulator di atas */}
      <PltsParameters />

      {/* Halaman praktikum PLTS dengan alat sungguhan (dulu berupa kartu di halaman ini) */}
      <nav aria-label="Praktikum PLTS" class="flex flex-wrap items-center gap-2 text-sm">
        <span class="font-medium text-gray-600">Buka praktikum:</span>
        <For each={pltsPraktikum}>
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
