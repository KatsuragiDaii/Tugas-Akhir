import { Navigate } from "@solidjs/router";

// Halaman PV sudah menyatu di halaman PLTS (/plts). Rute lama dipertahankan supaya bookmark dan
// tautan lama tetap berfungsi.
export default function PV() {
  return <Navigate href="/plts" />;
}
