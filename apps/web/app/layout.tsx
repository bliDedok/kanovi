import "./globals.css";

export const metadata = {
  title: "Kanovi POS",
  description: "Sistem Kasir Kanovi Escape",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Tambahkan suppressHydrationWarning agar Next.js tidak protes saat kita inject class 'dark' secara manual
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* SCRIPT PENCEGAT ANTI-KEDIP */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('kanovi_theme') === 'dark' || (!('kanovi_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}