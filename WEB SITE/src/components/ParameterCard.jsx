// Kartu satu parameter: label, nilai besar dengan satuan, dan ikon samar di kanan.
//
// props.label  teks label, mis. "Temperature"
// props.value  nilai yang sudah diformat, mis. "0.0"
// props.unit   satuan, mis. "° C" atau " V" (spasi di depan ikut ditampilkan)
// props.icon   elemen ikon (mis. <ParamIcon name="bulb" class="h-16 w-16" />)
export default function ParameterCard(props) {
  return (
    <div class="relative overflow-hidden rounded-2xl border border-sisgrid-line bg-white px-5 py-4 font-poppins">
      {/* Ikon dekoratif di belakang teks */}
      <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sisgrid-ghost" aria-hidden="true">
        {props.icon}
      </span>
      <p class="relative text-[15px] sm:text-[17px] font-medium leading-snug text-sisgrid">{props.label}</p>
      <p class="relative mt-1 text-[28px] sm:text-[34px] xl:text-[40px] font-bold leading-none tabular-nums text-sisgrid-ink">
        {props.value}
        {props.unit}
      </p>
    </div>
  );
}
