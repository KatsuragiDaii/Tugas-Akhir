import { Dynamic } from "solid-js/web";

// Ikon sederhana untuk sidebar dan header. Warna mengikuti warna teks (currentColor),
// ukuran diatur lewat prop `class` (mis. "w-6 h-6").

const svgProps = (props) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
  "aria-hidden": "true",
  class: props.class || "w-6 h-6",
});

export function SunIcon(props) {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg {...svgProps(props)}>
      <circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none" />
      {rays.map((deg) => (
        <line x1="12" y1="2.2" x2="12" y2="4.6" transform={`rotate(${deg} 12 12)`} />
      ))}
    </svg>
  );
}

export function DropIcon(props) {
  return (
    <svg {...svgProps(props)}>
      <path
        d="M12 2.8c3.6 4.3 6.2 7.5 6.2 10.8a6.2 6.2 0 0 1-12.4 0c0-3.3 2.6-6.5 6.2-10.8z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export function WindIcon(props) {
  return (
    <svg {...svgProps(props)}>
      <path d="M3 8.5h10.5a2.75 2.75 0 1 0-2.75-2.75" />
      <path d="M3 12.5h15a2.75 2.75 0 1 1-2.75 2.75" />
      <path d="M3 16.5h6.5a2.5 2.5 0 1 1-2.5 2.5" />
    </svg>
  );
}

export function GridIcon(props) {
  return (
    <svg {...svgProps(props)}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" fill="currentColor" stroke="none" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" fill="currentColor" stroke="none" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" fill="currentColor" stroke="none" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Avatar pengguna: lingkaran teal dengan siluet putih
export function UserAvatarIcon(props) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" class={props.class || "w-10 h-10"}>
      <circle cx="20" cy="20" r="20" fill="#004d5c" />
      <circle cx="20" cy="15" r="6.5" fill="#ffffff" />
      <path d="M7.5 33.5c1.6-6.4 6.4-9.6 12.5-9.6s10.9 3.2 12.5 9.6A19.9 19.9 0 0 1 20 40a19.9 19.9 0 0 1-12.5-6.5z" fill="#ffffff" />
    </svg>
  );
}

// Dipetakan dari field `icon` di json/menu-json.jsx
const NAV_ICONS = {
  sun: SunIcon,
  drop: DropIcon,
  wind: WindIcon,
  grid: GridIcon,
};

export function NavIcon(props) {
  return <Dynamic component={NAV_ICONS[props.name] || GridIcon} class={props.class} />;
}
