# Kanovi POS Starter (Web + API)

Starter kit untuk POS kasir berbasis web (tablet-friendly) + API + database (PostgreSQL).

## Prasyarat
- Node.js 20 LTS
- pnpm
- Docker (Docker Desktop)

## Quickstart (Development)
1) Copy env
```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

2) Jalankan database
```bash
docker compose up -d
```

3) Install dependencies
```bash
pnpm install
```

4) Migrasi database (buat tabel)
```bash
pnpm db:migrate
```

5) Run dev (web + api)
```bash
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001 (health: /health)

## Struktur
- apps/web  : Next.js (POS web)
- apps/api  : Fastify + Prisma (API)

## Catatan stok otomatis
Endpoint pembayaran: `POST /orders/:id/pay` akan mengurangi stok bahan sesuai resep (recipes) dan qty yang dibeli.

## Next steps (MVP)
- Auth sederhana (pin/role)
- Halaman POS: pilih menu, cart, checkout
- Halaman Inventory: low stock
- Kitchen screen: antrian + status pesanan

