import LogoutButton from "../components/LogoutButton";

export default function DashboardPage() {
  return (
    <div style={{ padding: '50px' }}>
      <h1>Dashboard Owner Kanovi ☕</h1>
      <p>Selamat datang, Owner! Nanti grafik omzet harian, CRUD Inventory, dan laporan keuangan ditaruh di sini.</p>
        <LogoutButton /> {/* Tombol Logout disisipkan di sini */}
    </div>
  );
}