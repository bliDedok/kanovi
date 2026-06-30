import Link from "next/link";
import {
  ArrowUpRight,
  Coffee,
  FolderKanban,
  PackageCheck,
} from "lucide-react";

const dashboardCards = [
  {
    title: "Kelola Menu",
    description: "Tambah, edit, dan hapus daftar kopi beserta harganya.",
    href: "/dashboard/menu",
    icon: Coffee,
  },
  {
    title: "Kelola Kategori",
    description: "Tambah, edit, dan hapus kategori menu.",
    href: "/dashboard/category",
    icon: FolderKanban,
  },
  {
    title: "Kelola Stock",
    description: "Atur stok bahan baku dan monitor level minimum.",
    href: "/dashboard/inventory",
    icon: PackageCheck,
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-fade-in">
      <section className="mb-8 rounded-[2.2rem] border border-white/70 bg-[#edf2f4] p-6 shadow-[18px_18px_42px_rgba(130,145,152,0.20),-14px_-14px_34px_rgba(255,255,255,0.92)] dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[18px_18px_42px_rgba(0,0,0,0.32),-8px_-8px_24px_rgba(255,255,255,0.035)] md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#20272c] dark:text-[#f7efe7] md:text-4xl">
              Dashboard Owner
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-[#6f7a80] dark:text-white/55 md:text-base">
              Selamat datang, Owner! Pantau performa dan kelola data Kanovi
              Escape di sini.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {dashboardCards.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-[2.2rem] border border-white/70 bg-[#edf2f4] p-6 shadow-[16px_16px_36px_rgba(130,145,152,0.20),-13px_-13px_30px_rgba(255,255,255,0.94)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[20px_20px_46px_rgba(130,145,152,0.24),-15px_-15px_34px_rgba(255,255,255,0.96)] active:translate-y-0 active:shadow-[inset_8px_8px_16px_rgba(130,145,152,0.22),inset_-8px_-8px_16px_rgba(255,255,255,0.94)] dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[16px_16px_36px_rgba(0,0,0,0.32),-7px_-7px_20px_rgba(255,255,255,0.035)] dark:hover:shadow-[20px_20px_46px_rgba(0,0,0,0.38),-8px_-8px_24px_rgba(255,255,255,0.04)] dark:active:shadow-[inset_8px_8px_16px_rgba(0,0,0,0.3),inset_-8px_-8px_16px_rgba(255,255,255,0.035)]"
            >
              <div className="mb-7 flex items-start justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[#edf2f4] text-[#20272c] shadow-[inset_4px_4px_9px_rgba(130,145,152,0.18),inset_-4px_-4px_9px_rgba(255,255,255,0.88)] transition-all duration-300 group-hover:text-[#2b65d9] dark:bg-white/[0.07] dark:text-white dark:shadow-[inset_4px_4px_9px_rgba(0,0,0,0.24),inset_-4px_-4px_9px_rgba(255,255,255,0.035)] dark:group-hover:text-[#FFD28A]">
                  <Icon className="h-7 w-7" strokeWidth={1.9} />
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#edf2f4] text-[#7a858b] shadow-[7px_7px_16px_rgba(130,145,152,0.18),-7px_-7px_16px_rgba(255,255,255,0.92)] transition-all duration-300 group-hover:text-[#20272c] group-active:shadow-[inset_5px_5px_10px_rgba(130,145,152,0.22),inset_-5px_-5px_10px_rgba(255,255,255,0.92)] dark:bg-white/[0.07] dark:text-white/45 dark:shadow-[7px_7px_16px_rgba(0,0,0,0.26),-5px_-5px_14px_rgba(255,255,255,0.035)] dark:group-hover:text-white dark:group-active:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.28),inset_-5px_-5px_10px_rgba(255,255,255,0.035)]">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </div>

              <h2 className="text-xl font-black tracking-tight text-[#20272c] dark:text-[#f7efe7] md:text-2xl">
                {item.title}
              </h2>

              <p className="mt-3 text-sm font-semibold leading-relaxed text-[#6f7a80] dark:text-white/50 md:text-base">
                {item.description}
              </p>

              <div className="mt-8 rounded-2xl bg-[#edf2f4] p-1.5 shadow-[inset_5px_5px_10px_rgba(130,145,152,0.2),inset_-5px_-5px_10px_rgba(255,255,255,0.9)] dark:bg-white/[0.055] dark:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.25),inset_-5px_-5px_10px_rgba(255,255,255,0.035)]">
                <div className="h-2 w-1/3 rounded-full bg-[#2b65d9] transition-all duration-300 group-hover:w-full dark:bg-[#FFD28A]" />
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}