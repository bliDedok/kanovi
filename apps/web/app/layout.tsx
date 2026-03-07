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
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}