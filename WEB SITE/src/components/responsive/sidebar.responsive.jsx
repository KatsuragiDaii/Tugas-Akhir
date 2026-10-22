import { For, Show } from "solid-js";
import { useLocation } from "@solidjs/router";
import { UseAuthCtx } from "~/context/auth.context";
import { NavIcon } from "~/components/icons";

// Role staff selalu melihat semua menu; role lain (plts, pltb, pltmh, praktikan)
// hanya melihat menu yang mencantumkan role-nya di `roles` (json/menu-json.jsx).
const STAFF_ROLES = ["root", "admin", "dosen", "asisten"];

export default function Sidebar(props) {

    const { auth } = UseAuthCtx();
    const location = useLocation();

    const canSee = (item) => {
        const role = auth() && auth().role;
        if (!role) return false;
        if (STAFF_ROLES.includes(role)) return true;
        return !!(item.roles && item.roles.includes(role));
    };

    // "/plts" juga aktif saat berada di "/plts/pv", "/plts/ongrid", dst.
    const isActive = (item) =>
        location.pathname === item.url || location.pathname.startsWith(`${item.url}/`);

    return (
        <aside class="hidden md:flex w-[216px] shrink-0 h-full flex-col bg-sisgrid text-white font-poppins">
            {/* Logo: ganti public/sisgrid-logo.svg dengan logo aslinya */}
            <a href="/dashboard" class="flex items-center gap-2.5 px-6 pt-7 pb-9">
                <img src="/sisgrid-logo.svg" alt="Sisgrid Logo" class="w-40 h-auto shrink-0" />
            </a>

            <nav class="px-2.5" aria-label="Menu utama">
                <ul class="space-y-2">
                    <For each={props.items}>
                        {(item) => (
                            <Show when={canSee(item)}>
                                <li>
                                    <a
                                        href={item.url}
                                        aria-current={isActive(item) ? "page" : undefined}
                                        class={`flex items-center gap-3 rounded-full px-5 py-2.5 text-[15px] font-bold transition-colors ${
                                            isActive(item) ? "bg-white text-sisgrid" : "text-white hover:bg-white/10"
                                        }`}
                                    >
                                        <NavIcon name={item.icon} class="w-6 h-6 shrink-0" />
                                        {item.label}
                                    </a>
                                </li>
                            </Show>
                        )}
                    </For>
                </ul>
            </nav>
        </aside>
    );
}
