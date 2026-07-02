import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto animate-fade-in w-full">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-kanovi-coffee dark:text-kanovi-bone">Dashboard Owner</h1>
        <p className="text-kanovi-coffee/70 dark:text-kanovi-cream/70 mt-2 text-sm md:text-lg">Selamat datang, Owner! Pantau performa dan kelola data Kanovi Escape di sini.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* KARTU MENU */}
        <Link href="/dashboard/menu" className="group bg-kanovi-paper dark:bg-kanovi-darker p-5 md:p-6 rounded-2xl shadow-sm border border-kanovi-cream/50 dark:border-white/5 hover:border-kanovi-wood dark:hover:border-kanovi-wood hover:shadow-md transition-all cursor-pointer">
          <div className="bg-kanovi-cream/50 dark:bg-kanovi-wood/20 w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="text-2xl md:text-3xl">☕</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-kanovi-coffee dark:text-kanovi-bone mb-2 group-hover:text-kanovi-wood transition-colors">Kelola Menu</h2>
          <p className="text-sm md:text-base text-kanovi-coffee/70 dark:text-kanovi-cream/60">Tambah, edit, dan hapus daftar kopi beserta harganya.</p>
        </Link>

          <Link href="/dashboard/recipe" className="group bg-kanovi-paper dark:bg-kanovi-darker p-5 md:p-6 rounded-2xl shadow-sm border border-kanovi-cream/50 dark:border-white/5 hover:border-kanovi-wood dark:hover:border-kanovi-wood hover:shadow-md transition-all cursor-pointer">
          <div className="bg-kanovi-cream/50 dark:bg-kanovi-wood/20 w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="text-2xl md:text-3xl">📖</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-kanovi-coffee dark:text-kanovi-bone mb-2 group-hover:text-kanovi-wood transition-colors">Kelola Recipe</h2>
          <p className="text-sm md:text-base text-kanovi-coffee/70 dark:text-kanovi-cream/60">Atur komposisi bahan tiap menu dan perbarui resep.</p>
        </Link>

        <Link href="/dashboard/category" className="group bg-kanovi-paper dark:bg-kanovi-darker p-5 md:p-6 rounded-2xl shadow-sm border border-kanovi-cream/50 dark:border-white/5 hover:border-kanovi-wood dark:hover:border-kanovi-wood hover:shadow-md transition-all cursor-pointer">
          <div className="bg-kanovi-cream/50 dark:bg-kanovi-wood/20 w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="text-2xl md:text-3xl">📊</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-kanovi-coffee dark:text-kanovi-bone mb-2 group-hover:text-kanovi-wood transition-colors">Kelola Kategori</h2>
          <p className="text-sm md:text-base text-kanovi-coffee/70 dark:text-kanovi-cream/60">Tambah, edit, dan hapus kategori menu.</p>
        </Link>

        <Link href="/dashboard/inventory" className="group bg-kanovi-paper dark:bg-kanovi-darker p-5 md:p-6 rounded-2xl shadow-sm border border-kanovi-cream/50 dark:border-white/5 hover:border-kanovi-wood dark:hover:border-kanovi-wood hover:shadow-md transition-all cursor-pointer">
          <div className="bg-kanovi-cream/50 dark:bg-kanovi-wood/20 w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="text-2xl md:text-3xl">📦</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-kanovi-coffee dark:text-kanovi-bone mb-2 group-hover:text-kanovi-wood transition-colors">Kelola Stock</h2>
          <p className="text-sm md:text-base text-kanovi-coffee/70 dark:text-kanovi-cream/60">Atur stok bahan baku dan monitor level minimum.</p>
        </Link>

          <Link href="/dashboard/finance" className="group bg-kanovi-paper dark:bg-kanovi-darker p-5 md:p-6 rounded-2xl shadow-sm border border-kanovi-cream/50 dark:border-white/5 hover:border-kanovi-wood dark:hover:border-kanovi-wood hover:shadow-md transition-all cursor-pointer">
          <div className="bg-kanovi-cream/50 dark:bg-kanovi-wood/20 w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="text-2xl md:text-3xl">📈</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-kanovi-coffee dark:text-kanovi-bone mb-2 group-hover:text-kanovi-wood transition-colors">Kelola Keuangan</h2>
          <p className="text-sm md:text-base text-kanovi-coffee/70 dark:text-kanovi-cream/60">Laporan Keuangan Kanovi</p>
        </Link>

      </div>
    </div>

    
  );
}