import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Owner</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Selamat datang, Owner! Pantau performa dan kelola data Kanovi Escape di sini.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Kartu Menu */}
        <Link href="/dashboard/menu" className="group bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 hover:shadow-md transition-all cursor-pointer">
          <div className="bg-green-100 dark:bg-green-900/30 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="text-3xl">☕</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Kelola Menu</h2>
          <p className="text-gray-500 dark:text-gray-400">Tambah, edit, dan hapus daftar kopi beserta harganya.</p>
        </Link>
        
        {/* Kartu Bahan (Coming Soon) */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700/50 opacity-60 cursor-not-allowed">
          <div className="bg-gray-200 dark:bg-gray-700 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
            <span className="text-3xl opacity-50">📦</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-300 mb-2">Kelola Bahan</h2>
          <p className="text-gray-500 dark:text-gray-400">Atur stok bahan baku (Segera Hadir).</p>
        </div>
      </div>
    </div>
  );
}