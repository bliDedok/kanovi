import LogoutButton from "../components/LogoutButton";

async function getMenus() {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";
  const res = await fetch(`${base}/menus`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function POSPage() {
  const menus = await getMenus();
  return (
    <main style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>POS Kanovi Escape ☕</h1>
        <LogoutButton /> {/* Tombol disisipkan di sini */}
      </div>
      
      <p>List menu dari API. Seed dulu lewat API: <code>POST /dev/seed</code></p>
      {/* ... (grid menu di bawahnya biarkan sama) */}
    </main>
  );
}
