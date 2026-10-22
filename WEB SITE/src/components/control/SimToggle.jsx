// Tombol on/off berupa bar teal dengan label di tengah dan saklar di kanan.
//
// props.label     teks di tengah bar
// props.checked   true bila menyala
// props.onChange  dipanggil dengan nilai baru saat saklar diklik
export default function SimToggle(props) {
  return (
    <div class="relative flex items-center justify-center rounded-lg bg-sisgrid px-14 py-3 font-poppins text-white">
      <span class="text-[15px] font-bold">{props.label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={props.checked}
        aria-label={props.label}
        onClick={() => props.onChange(!props.checked)}
        class={`absolute right-4 top-1/2 h-6 w-11 -translate-y-1/2 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
          props.checked ? "bg-emerald-400" : "bg-gray-500"
        }`}
      >
        <span
          class={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-gray-100 shadow transition-transform ${
            props.checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}
