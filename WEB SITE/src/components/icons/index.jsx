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

// ---- Ikon kartu parameter PLTS (dipakai sebagai gambar latar samar) ----

export function ThermometerIcon(props) {
  return (
    <svg {...svgProps(props)} stroke-width="1.5">
      <path d="M9.5 14.6V5a2.5 2.5 0 0 1 5 0v9.6a4.3 4.3 0 1 1-5 0z" />
      <path d="M12 9v8.2" />
      <circle cx="12" cy="17.6" r="1.6" fill="currentColor" stroke="none" />
      <path d="M16.5 6h2M16.5 9h2M16.5 12h2" />
    </svg>
  );
}

export function HumidityIcon(props) {
  return (
    <svg {...svgProps(props)} stroke-width="1.5">
      <path d="M8.5 2.8c2.6 3.1 4.5 5.4 4.5 7.8a4.5 4.5 0 0 1-9 0c0-2.4 1.9-4.7 4.5-7.8z" />
      <path d="M17 2c1.5 1.8 2.5 3.1 2.5 4.4a2.5 2.5 0 0 1-5 0c0-1.3 1-2.6 2.5-4.4z" />
      <path d="M2.5 16.5c1.5-1.2 3-1.2 4.5 0s3 1.2 4.5 0 3-1.2 4.5 0 3 1.2 4.5 0" />
      <path d="M2.5 20.5c1.5-1.2 3-1.2 4.5 0s3 1.2 4.5 0 3-1.2 4.5 0 3 1.2 4.5 0" />
    </svg>
  );
}

export function BulbIcon(props) {
  return (
    <svg {...svgProps(props)} stroke-width="1.5">
      <path d="M12 4.5a5.5 5.5 0 0 0-3.2 10c.7.5 1.2 1.3 1.2 2.2v.5h4v-.5c0-.9.5-1.7 1.2-2.2A5.5 5.5 0 0 0 12 4.5z" />
      <path d="M9.6 19.6h4.8M10.6 22h2.8" />
      <path d="M12 1.2v1.4M4.6 4.2l1 1M19.4 4.2l-1 1M1.8 10.2h1.4M20.8 10.2h1.4" />
    </svg>
  );
}

export function BoltIcon(props) {
  return (
    <svg {...svgProps(props)}>
      <path d="M13.6 1.8 4.8 13.4h5.6L9.4 22.2 19.2 9.8h-5.9z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ChevronDownIcon(props) {
  return (
    <svg {...svgProps(props)} stroke-width="2.5">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

// Dipetakan dari field `icon` di json/plts-parameter-json.jsx
const PARAM_ICONS = {
  thermometer: ThermometerIcon,
  humidity: HumidityIcon,
  bulb: BulbIcon,
  bolt: BoltIcon,
};

export function ParamIcon(props) {
  return <Dynamic component={PARAM_ICONS[props.name] || BoltIcon} class={props.class} />;
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
