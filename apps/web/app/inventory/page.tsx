async function getLowStock() {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";
  const res = await fetch(`${base}/health`, { cache: "no-store" });
  return res.ok;
}

export default async function InventoryPage() {
  const apiOk = await getLowStock();
  return (
    <main>
      <h1>Inventory (Demo)</h1>
      <p>API status: {apiOk ? "OK" : "DOWN"}</p>
      <p>Selanjutnya: bikin halaman bahan + low stock + penyesuaian stok.</p>
    </main>
  );
}
