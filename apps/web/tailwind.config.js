/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // PALET WARNA KANOVI COFFEE SHOP
        kanovi: {
          bone: '#F9F6F0',      // Whitebone / Beige terang (untuk background)
          cream: '#EADBC8',     // Cream coklat muda (untuk hover atau aksen)
          wood: '#A97142',      // Coklat kayu / Caramel (Warna utama/tombol)
          coffee: '#5C3D2E',    // Coklat kopi pekat (untuk teks atau heading)
          dark: '#2C231F',      // Coklat kehitaman (Background Dark Mode)
          darker: '#1E1714',    // Hitam pekat kecoklatan (Sidebar Dark Mode)
        }
      }
    },
  },
  plugins: [],
}