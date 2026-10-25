import { createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import SimulatorFallback from "./SimulatorFallback";
import { ResetViewIcon, RotateIcon } from "~/components/icons";
import { PLTS_PARTS, partInfo } from "~/json/plts-parts-json";
import { PV_CAMERA, createPvModel } from "./pv-model";

// Simulator 3D PLTS yang interaktif (Three.js):
//   - seret untuk memutar, scroll/cubit untuk zoom, seret klik-kanan atau dua jari untuk menggeser
//   - klik sebuah bagian: bagian itu disorot dan namanya muncul (label di atas model + keterangan di bawahnya)
//   - bagian yang punya kontrol (panel, lampu, kipas, pemanas) ikut memanggil props.onSelect
//     sehingga halaman bisa memfokuskan kontrol yang terkait
//   - tombol pilih (chip) di bawah model: cara memilih bagian lewat keyboard atau layar sentuh
//
// Model 3D dan pengaturan kamera/cahaya dipindahkan dari repo Virtual-Lab-Smartgrid
// (https://github.com/goesaditya/Virtual-Lab-Smartgrid, dikirim oleh pemilik proyek ini).
// Geometri ada di pv-model.js; daftar nama dan keterangan bagian ada di json/plts-parts-json.jsx.
//
// Props:
//   tilt        kemiringan panel, 0-90 derajat
//   intensity   intensitas cahaya, 0-1200 W/m2
//   fan         kipas menyala (true/false)
//   heater      pemanas menyala (true/false)
//   class       kelas CSS untuk area model (tentukan tingginya di sini, mis. "h-[380px]")
//   onSelect    dipanggil dengan info bagian ({ name, description, control }) saat bagian dipilih,
//               dan dengan null saat pilihan dihapus
//
// Three.js dimuat dinamis di browser (tidak ikut di server maupun di bundel awal halaman).
// Bila browser tidak mendukung WebGL, yang tampil adalah gambar SVG biasa (SimulatorFallback).

const CLICK_SLOP_PX = 5; // geser kurang dari ini dianggap klik, bukan memutar model

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export default function Simulator3D(props) {

  let host;       // tempat canvas WebGL dipasang
  let labelEl;    // label nama bagian di atas model
  let api = null; // diisi saat adegan 3D siap: { model, select, clear, resetCamera, setAutoRotate }

  const [status, setStatus] = createSignal("loading"); // loading | ready | fallback
  const [selected, setSelected] = createSignal(null);  // nama bagian yang dipilih
  const [rotating, setRotating] = createSignal(false);

  const info = () => (selected() ? partInfo(selected()) ?? { name: selected() } : null);

  // onCleanup harus didaftarkan sebelum ada `await` (setelah itu konteks Solid hilang),
  // jadi pembongkaran adegan 3D diisi belakangan lewat `teardown`.
  let teardown = null;
  let disposed = false;
  onCleanup(() => {
    disposed = true;
    teardown?.();
  });

  // Nilai kontrol dari halaman diteruskan ke model
  createEffect(() => {
    const state = { tilt: props.tilt, intensity: props.intensity, fan: props.fan, heater: props.heater };
    if (status() === "ready") api.model.setState(state);
  });

  onMount(async () => {

    let THREE, OrbitControls;
    try {
      [THREE, { OrbitControls }] = await Promise.all([
        import("three"),
        import("three/examples/jsm/controls/OrbitControls.js"),
      ]);
    } catch (error) {
      console.error("Gagal memuat Three.js", error);
      setStatus("fallback");
      return;
    }
    if (disposed) return; // komponen sudah dilepas selagi memuat

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    // ---- Renderer, adegan, kamera ----
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (error) {
      console.warn("WebGL tidak tersedia, memakai tampilan cadangan", error);
      setStatus("fallback");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.className = "block h-full w-full";
    canvas.setAttribute("role", "img");
    canvas.setAttribute(
      "aria-label",
      "Model 3D simulator PLTS. Pilih bagiannya lewat tombol di bawah model, atau klik langsung pada model."
    );
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(...PV_CAMERA.position);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(...PV_CAMERA.target);
    controls.enableDamping = !reducedMotion;
    controls.minDistance = 2.5;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // tidak bisa melihat dari bawah lantai
    controls.autoRotateSpeed = 1.5;
    controls.update();

    // Cahaya dan lantai seperti di repo asal
    scene.add(new THREE.HemisphereLight("#ffffff", "#849da9", 2.8));
    const sun = new THREE.DirectionalLight("#ffffff", 3);
    sun.position.set(3, 7, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 });
    sun.shadow.normalBias = 0.03;
    scene.add(sun);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.12 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(12, 40, "#c9d8d9", "#dbe5e5");
    grid.position.y = -0.005;
    grid.material.transparent = true;
    grid.material.opacity = 0.42;
    scene.add(grid);

    // ---- Model PLTS ----
    const model = createPvModel(THREE, { reducedMotion });
    scene.add(model.root);
    model.setState({ tilt: props.tilt, intensity: props.intensity, fan: props.fan, heater: props.heater }, true);

    // ---- Penanda bagian terpilih: kotak tembus pandang + garis tepi yang tetap terlihat ----
    const selection = new THREE.Group();
    selection.visible = false;
    const unit = new THREE.BoxGeometry(1, 1, 1);
    const fillMaterial = new THREE.MeshBasicMaterial({
      color: "#00a3b8", transparent: true, opacity: 0.14, depthWrite: false,
    });
    const edgeGeometry = new THREE.EdgesGeometry(unit);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: "#007c8e", depthTest: false });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.renderOrder = 999;
    selection.add(new THREE.Mesh(unit, fillMaterial), edges);
    scene.add(selection);

    const box = new THREE.Box3();
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    const anchor = new THREE.Vector3();
    let selectedName = null;
    let selectedMeshes = [];

    // ---- Menggambar: hanya bila ada yang berubah, supaya CPU/GPU tenang saat diam ----
    let needsRender = true;
    let visible = true;
    let cameraMove = null; // animasi kembali ke tampilan awal
    let raf = 0;
    let last = performance.now();

    const updateSelectionBox = () => {
      box.makeEmpty();
      for (const mesh of selectedMeshes) {
        if (mesh.userData.noBounds) continue;
        mesh.updateWorldMatrix(true, false); // induknya (mis. panel yang miring) mungkin baru berubah
        box.expandByObject(mesh);
      }
      if (box.isEmpty()) {
        selection.visible = false;
        return;
      }
      box.getCenter(center);
      box.getSize(size);
      selection.position.copy(center);
      selection.scale.set(Math.max(size.x, 0.02) + 0.04, Math.max(size.y, 0.02) + 0.04, Math.max(size.z, 0.02) + 0.04);
      selection.visible = true;
    };

    // Label nama: titik di atas bagian terpilih diproyeksikan ke layar
    const placeLabel = () => {
      if (!selectedName || !labelEl) return;
      const w = host.clientWidth;
      const h = host.clientHeight;
      anchor.set(center.x, box.max.y + 0.03, center.z).project(camera);
      if (anchor.z > 1 || w < 10) {
        labelEl.style.visibility = "hidden";
        return;
      }
      const x = clamp((anchor.x * 0.5 + 0.5) * w, 84, Math.max(84, w - 84));
      const y = clamp((-anchor.y * 0.5 + 0.5) * h, 46, Math.max(46, h - 10));
      labelEl.style.visibility = "visible";
      labelEl.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, calc(-100% - 10px))`;
    };

    const renderNow = () => {
      if (selectedName) {
        if (selectedName === "Panel surya") updateSelectionBox(); // ikut miring bersama panel
        placeLabel();
      }
      renderer.render(scene, camera);
      needsRender = false;
    };

    // ---- Memilih bagian ----
    const clear = () => {
      if (selectedName === null) return;
      selectedName = null;
      selectedMeshes = [];
      selection.visible = false;
      setSelected(null);
      props.onSelect?.(null);
      needsRender = true;
    };

    const select = (name, hitMesh) => {
      selectedName = name;
      selectedMeshes = model.meshesFor(name, hitMesh);
      updateSelectionBox();
      setSelected(name);
      props.onSelect?.(partInfo(name) ?? { name, control: null });
      needsRender = true;
    };

    // ---- Klik pada model ----
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const pick = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      return ray.intersectObjects(model.pickables, false)[0]?.object ?? null;
    };

    const pressed = new Map(); // pointerId -> posisi awal; dipakai membedakan klik dari memutar/cubit
    let multiTouch = false;
    const onPointerDown = (e) => {
      if (pressed.size === 0) multiTouch = false;
      else multiTouch = true; // dua jari = zoom/geser, bukan klik
      pressed.set(e.pointerId, { x: e.clientX, y: e.clientY });
      cameraMove = null; // pengguna memegang kamera: batalkan animasi
      canvas.style.cursor = "grabbing";
    };
    const onPointerUp = (e) => {
      const start = pressed.get(e.pointerId);
      pressed.delete(e.pointerId);
      if (pressed.size === 0) canvas.style.cursor = "grab";
      if (!start || multiTouch || pressed.size > 0 || e.button !== 0) return;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > CLICK_SLOP_PX) return;
      const mesh = pick(e.clientX, e.clientY);
      if (mesh) select(mesh.userData.partName, mesh);
      else clear();
    };
    const onPointerCancel = (e) => {
      pressed.delete(e.pointerId);
      if (pressed.size === 0) canvas.style.cursor = "grab";
    };

    // Kursor jadi tangan saat di atas bagian yang bisa diklik (dihitung sekali per frame)
    let hover = null;
    const onPointerMove = (e) => {
      hover = e.pointerType === "mouse" && pressed.size === 0 ? { x: e.clientX, y: e.clientY } : null;
    };
    const onPointerLeave = () => {
      hover = null;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerCancel);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    controls.addEventListener("change", () => (needsRender = true));
    canvas.style.cursor = "grab";

    // ---- Ukuran mengikuti wadah ----
    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w < 2 || h < 2) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderNow(); // langsung digambar: setSize mengosongkan canvas
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    // Tidak menggambar saat model di luar layar
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) needsRender = true;
    });
    visibilityObserver.observe(host);

    const onContextLost = (e) => e.preventDefault(); // izinkan pemulihan otomatis
    const onContextRestored = () => (needsRender = true);
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    // ---- Kamera ----
    const homePosition = new THREE.Vector3(...PV_CAMERA.position);
    const homeTarget = new THREE.Vector3(...PV_CAMERA.target);
    // Hentikan sisa gerak (inersia) kamera: dipakai saat reset dan saat putar otomatis dimatikan
    const stopInertia = () => {
      controls.enableDamping = false;
      controls.update();
      controls.enableDamping = !reducedMotion;
    };
    const resetCamera = () => {
      stopInertia(); // kalau tidak, kamera melenceng dari tampilan awal oleh sisa gerak seretan terakhir
      if (reducedMotion) {
        camera.position.copy(homePosition);
        controls.target.copy(homeTarget);
        controls.update();
        needsRender = true;
        return;
      }
      cameraMove = { t: 0, fromPosition: camera.position.clone(), fromTarget: controls.target.clone() };
    };
    const setAutoRotate = (on) => {
      controls.autoRotate = on;
      if (!on) stopInertia(); // berhenti seketika, tidak meluncur beberapa detik
      setRotating(on);
      needsRender = true;
    };

    // ---- Putaran animasi ----
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible) return;

      if (cameraMove) {
        cameraMove.t = Math.min(1, cameraMove.t + dt / 0.6);
        const eased = 1 - Math.pow(1 - cameraMove.t, 3);
        camera.position.lerpVectors(cameraMove.fromPosition, homePosition, eased);
        controls.target.lerpVectors(cameraMove.fromTarget, homeTarget, eased);
        if (cameraMove.t >= 1) cameraMove = null;
        needsRender = true;
      }
      controls.update(dt); // memicu event "change" (needsRender) bila kamera bergerak

      if (model.busy()) {
        model.tick(dt, now / 1000);
        needsRender = true;
      }

      if (hover) {
        canvas.style.cursor = pick(hover.x, hover.y) ? "pointer" : "grab";
        hover = null;
      }

      if (needsRender) renderNow();
    };
    raf = requestAnimationFrame(loop);

    api = { model, select, clear, resetCamera, setAutoRotate };
    setStatus("ready");
    resize();

    teardown = () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      controls.dispose();
      model.dispose();
      floor.geometry.dispose();
      floor.material.dispose();
      grid.geometry.dispose();
      grid.material.dispose();
      unit.dispose();
      edgeGeometry.dispose();
      fillMaterial.dispose();
      edgeMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      api = null;
    };
  });

  const toggleChip = (name) => {
    if (selected() === name) api?.clear();
    else api?.select(name);
  };

  const iconButton =
    "grid h-9 w-9 place-items-center rounded-full border border-sisgrid-line bg-white/90 text-sisgrid shadow-sm transition hover:bg-sisgrid hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sisgrid";

  return (
    <div class="flex w-full flex-col gap-3 font-poppins">

      {/* Area model */}
      <div class={`relative w-full overflow-hidden rounded-2xl border border-sisgrid-line bg-gradient-to-b from-white to-[#eef4f5] ${props.class ?? "h-[380px]"}`}>
        <div ref={host} class="absolute inset-0" data-testid="sim3d-host" />

        <Show when={status() === "loading"}>
          <div class="absolute inset-0 grid place-items-center text-sm font-medium text-sisgrid" role="status">
            Memuat model 3D…
          </div>
        </Show>

        <Show when={status() === "fallback"}>
          <SimulatorFallback
            class="absolute inset-0 h-full w-full p-2"
            tilt={props.tilt}
            intensity={props.intensity}
            fan={props.fan}
            heater={props.heater}
          />
          <p
            class="absolute bottom-2 left-3 right-3 text-center text-xs text-gray-600"
            data-testid="sim3d-fallback-note"
          >
            Browser ini tidak mendukung WebGL, jadi yang tampil gambar statis (tidak bisa diputar atau diklik).
          </p>
        </Show>

        <Show when={status() === "ready"}>
          <div class="absolute right-3 top-3 flex flex-col gap-2">
            <button
              type="button"
              class={iconButton}
              title="Kembali ke tampilan awal"
              aria-label="Kembali ke tampilan awal"
              onClick={() => api?.resetCamera()}
            >
              <ResetViewIcon class="h-5 w-5" />
            </button>
            <button
              type="button"
              class={`${iconButton} ${rotating() ? "!bg-sisgrid !text-white" : ""}`}
              title="Putar otomatis"
              aria-label="Putar otomatis"
              aria-pressed={rotating()}
              onClick={() => api?.setAutoRotate(!rotating())}
            >
              <RotateIcon class="h-5 w-5" />
            </button>
          </div>
        </Show>

        {/* Label nama bagian; posisinya diatur dari loop gambar. Teks yang sama sudah ada di keterangan bawah */}
        <div
          ref={labelEl}
          aria-hidden="true"
          data-testid="part-label"
          class="pointer-events-none absolute left-0 top-0 whitespace-nowrap rounded-md bg-sisgrid px-2.5 py-1 text-xs font-semibold text-white shadow-md"
          style={{ display: selected() ? "block" : "none" }}
        >
          {selected()}
          <span class="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-sisgrid" />
        </div>
      </div>

      <Show when={status() === "ready"}>

        {/* Pilih bagian lewat tombol: untuk keyboard dan layar sentuh */}
        <div role="group" aria-label="Pilih bagian simulator" class="flex flex-wrap gap-2">
          <For each={PLTS_PARTS.filter((part) => part.chip)}>
            {(part) => (
              <button
                type="button"
                aria-pressed={selected() === part.name}
                onClick={() => toggleChip(part.name)}
                class={`rounded-full border-2 border-sisgrid px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sisgrid ${
                  selected() === part.name ? "bg-sisgrid text-white" : "bg-white text-sisgrid hover:bg-sisgrid/10"
                }`}
              >
                {part.name}
              </button>
            )}
          </For>
        </div>

        <p class="min-h-[2.75rem] text-sm text-gray-700" aria-live="polite" data-testid="part-info">
          <Show
            when={info()}
            fallback={
              <span class="text-gray-500">
                Seret untuk memutar, scroll atau cubit untuk zoom, klik bagian model untuk melihat namanya.
              </span>
            }
          >
            {(part) => (
              <>
                <span class="font-bold text-sisgrid">Dipilih: {part().name}</span>
                <Show when={part().description}>
                  <span> — {part().description}</span>
                </Show>
              </>
            )}
          </Show>
        </p>
      </Show>
    </div>
  );
}
