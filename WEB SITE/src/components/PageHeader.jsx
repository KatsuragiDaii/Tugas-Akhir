import { createSignal, onCleanup, onMount } from "solid-js";
import { UseAuthCtx } from "~/context/auth.context";
import UserDropdown from "~/partials/user.dropdown";
import { UserAvatarIcon } from "~/components/icons";

// Header halaman bergaya SISGRID: ikon + judul besar di kiri, pengguna di kanan.
// Klik pengguna untuk membuka menu (Profile, Pengaturan User, Logout).
//
// props.title : teks judul
// props.icon  : elemen ikon (mis. <SunIcon class="w-12 h-12" />)
export default function PageHeader(props) {

  const { auth } = UseAuthCtx();
  const [open, setOpen] = createSignal(false);
  let box;

  onMount(() => {
    const onPointerDown = (event) => {
      if (box && !box.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    onCleanup(() => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    });
  });

  return (
    <header class="flex items-center justify-between gap-4 font-poppins">
      <div class="flex items-center gap-4 min-w-0">
        <span class="shrink-0 text-sisgrid-ink">{props.icon}</span>
        <h1 class="text-2xl sm:text-3xl lg:text-[40px] leading-tight font-bold text-sisgrid-ink">
          {props.title}
        </h1>
      </div>

      <div class="relative shrink-0" ref={box}>
        <button
          type="button"
          class="flex items-center gap-3 rounded-full p-1 pr-2 hover:bg-black/5"
          aria-haspopup="menu"
          aria-expanded={open()}
          onClick={() => setOpen(!open())}
        >
          <UserAvatarIcon class="w-10 h-10" />
          <span class="hidden sm:inline text-sm font-bold text-sisgrid-ink capitalize">
            {auth() && auth().username}
          </span>
        </button>
        <UserDropdown hidden={!open()} />
      </div>
    </header>
  );
}
