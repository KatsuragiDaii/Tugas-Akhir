// Saat bagian model 3D diklik, kontrol yang terkait difokuskan dan diberi penanda sesaat
// (lihat .ctl-flash di app.css). Dipakai halaman PLTS dan PLTMH.
//
// Kontrol dicari lewat id elemen; kotak penandanya adalah leluhur terdekat yang
// memiliki atribut data-control-box (lihat SliderControl, SimToggle, PumpSpeedControl).
// preventScroll: halaman tidak ikut bergulir.

const flashTimers = new WeakMap(); // satu pewaktu per kontrol, supaya klik berurutan tidak saling memotong

export function focusControl(id) {
  const element = id ? document.getElementById(id) : null;
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
