// Slider bergaya SISGRID: label di kiri, nilai di kanan, batas min/maks di bawah.
// Gaya track/thumb ada di app.css (.sisgrid-range); bagian terisi diatur lewat --fill.
//
// props.label    teks label
// props.unit     satuan (opsional), mis. "°" atau "W/m²"
// props.min/max  batas; props.step (default 1)
// props.value    nilai saat ini; props.onInput(angka) dipanggil saat slider digeser
// props.id       id elemen slider (opsional; bawaannya diturunkan dari label). Dipakai Simulator3D
//                untuk memfokuskan slider ini saat bagian model yang terkait diklik.
export default function SliderControl(props) {

  const id = props.id ?? `slider-${String(props.label).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const percent = () => ((props.value - props.min) / (props.max - props.min)) * 100;

  return (
    <div class="font-poppins rounded-lg" data-control-box>
      <div class="flex items-baseline justify-between gap-2">
        <label for={id} class="text-[15px] font-medium text-sisgrid">
          {props.label}
        </label>
        <span class="text-[15px] font-bold text-sisgrid">
          {props.value}
          {props.unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        class="sisgrid-range mt-2"
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        value={props.value}
        style={{ "--fill": `${percent()}%` }}
        onInput={(event) => props.onInput(Number(event.currentTarget.value))}
      />
      <div class="mt-1 flex justify-between text-[10px] text-sisgrid">
        <span>
          {props.min}
          {props.unit}
        </span>
        <span>
          {props.max}
          {props.unit}
        </span>
      </div>
    </div>
  );
}
