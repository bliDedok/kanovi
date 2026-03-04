async function getMenus() {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";
  const res = await fetch(`${base}/menus`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function POSPage() {
  const menus = await getMenus();
  return (
    <main>
      <h1>POS (Demo)</h1>
      <p>List menu dari API. Seed dulu lewat API: <code>POST /dev/seed</code></p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {menus.map((m: any) => (
          <div key={m.id} style={{ border: "1px solid #2222", borderRadius: 12, padding: 12 }}>
            <div style={{ fontWeight: 700 }}>{m.name}</div>
            <div>Rp {m.price.toLocaleString("id-ID")}</div>
          </div>
        ))}
        {menus.length === 0 && (
          <div style={{ opacity: 0.7 }}>
            Belum ada menu. Jalankan seed:
            <pre style={{ background: "#0001", padding: 12, borderRadius: 12 }}>
              curl -X POST http://localhost:3001/dev/seed
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
