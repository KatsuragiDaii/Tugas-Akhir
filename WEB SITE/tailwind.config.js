/** @type {import('tailwindcss').Config} */
module.exports = {
  media: false,
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palet tampilan SISGRID Laboratory (halaman PLTS)
        sisgrid: {
          DEFAULT: "#004d5c", // teal sidebar, judul kontrol, tombol
          dark: "#003a46",
          bg: "#f0f0f0",      // latar halaman
          ink: "#1a1a1a",     // teks judul
          line: "#d9d9d9",    // garis tepi kartu
          maroon: "#5c0000",  // tombol reset
          ghost: "#e3ebed",   // ikon latar samar pada kartu parameter
        },
      },
      fontFamily: {
        poppins: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}
