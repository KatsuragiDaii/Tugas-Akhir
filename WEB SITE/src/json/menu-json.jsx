// Menu sidebar.
//  - icon  : nama ikon, lihat NAV_ICONS di components/icons/index.jsx
//  - roles : role non-staff yang boleh melihat menu ini. Staff (root, admin, dosen,
//            asisten) selalu melihat semua menu, lihat sidebar.responsive.jsx
//  - childs: tidak lagi ditampilkan di sidebar (tampilan baru memakai menu satu tingkat);
//            datanya dipertahankan, mis. untuk tautan di halaman /plts
export const menuRows = [
    {
        label: "PLTS", description: "sistem pembangkit listrik tenaga surya (PLTS)", url: "/plts", icon: "sun",
        childs: [
            { label: "PV", description: "Solar Panel simulation practical", url: "/plts/pv" },
            { label: "On Grid", description: "sistem pembangkit listrik tenaga surya (PLTS) yang terhubung ke jaringan listrik umum", url: "/plts/ongrid" },
            { label: "Off Grid", description: "sistem pembangkit listrik tenaga surya (PLTS) yang tidak terhubung ke jaringan listrik umum", url: "/plts/offgrid" }
        ],
        roles: ["dosen","asisten","plts"]
    },
    {
        label: "PLTMH", description: "sistem pembangkit listrik tenaga MICRO HYDRO", url: "/pltmh", icon: "drop", roles: ["dosen","asisten","pltmh"]
    },
    {
        label: "PLTB", description: "sistem pembangkit listrik tenaga Angin", url: "/pltb", icon: "wind", roles: ["dosen","asisten","pltb"]
    },
    {
        label: "Smart Grid", description: "monitoring gabungan PLTS, PLTB, dan PLTMH", url: "/smartgrid", icon: "grid", roles: ["dosen","asisten"]
    }
]