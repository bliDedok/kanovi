export const metadata = {
  title: "Kanovi POS",
  description: "POS web starter"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <div style={{ padding: 16, borderBottom: "1px solid #2222" }}>
          <strong>Kanovi POS</strong> — <a href="/">Home</a>{" "}
          | <a href="/pos">POS</a> | <a href="/inventory">Inventory</a>
        </div>
        <div style={{ padding: 16 }}>{children}</div>
      </body>
    </html>
  );
}
