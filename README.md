# Kanovi POS System

Kanovi POS System adalah aplikasi Point of Sale berbasis web yang dikembangkan untuk membantu proses operasional kasir, pengelolaan pesanan, manajemen stok bahan, antrean dapur, pembayaran, pencetakan struk, void order, hingga daily closing.

Sistem ini dikembangkan sebagai Minimum Viable Product (MVP) untuk mendukung proses transaksi pada usaha makanan dan minuman.

---

## Deskripsi Sistem

Kanovi POS System merupakan sistem kasir berbasis web yang memiliki fitur utama untuk mencatat transaksi penjualan, mengelola menu, mengurangi stok bahan secara otomatis, menampilkan antrean pesanan dapur, memproses pembayaran, mencetak struk transaksi, melakukan void order, serta membuat laporan penutupan kas harian.

Sistem ini dibangun menggunakan pendekatan Layered Architecture agar setiap bagian kode memiliki tanggung jawab yang jelas. Backend digunakan untuk menangani proses bisnis seperti order, pembayaran, inventory, kitchen queue, receipt, void order, printer, dan finance. Frontend digunakan sebagai antarmuka pengguna untuk kasir, dapur, dan admin.

---

## Kontribusi Anggota

| Nama | NIM | Peran | Fitur yang Dikerjakan | Link Video |
|---|---|---|---|---|
| I Made Dedy Wanditya | 42430042 | Backend / Frontend Developer | POS flow, finance closing, printer receipt, layered architecture, linter fixing, dan clean code | https://youtu.be/A38gFtt8erg?si=_TLUouCB4fFTddGP |
| Paul Yang | 42430043 |  |  |  |
| I Gede Nada Arsana | 42430011 |  |  |  |
| Bryan Terence | 42430044 |  |  |  |

---

## Fitur Utama

### 1. Authentication

- Login pengguna.
- Logout pengguna.
- Pembatasan akses berdasarkan kebutuhan pengguna.

### 2. Point of Sale

- Menampilkan daftar menu.
- Membuat pesanan.
- Menghitung total pembayaran.
- Memproses pembayaran menggunakan CASH dan QRIS.
- Menyimpan transaksi ke sistem.

### 3. Order Management

- Menyimpan data pesanan.
- Menampilkan riwayat pesanan.
- Mengelola status pesanan.
- Mendukung void order dengan pencatatan alasan.

### 4. Kitchen Queue

- Menampilkan antrean pesanan untuk dapur.
- Mengatur status proses pesanan.
- Membantu dapur melihat pesanan yang perlu diproses.

### 5. Inventory Management

- Mengelola stok bahan.
- Mencatat pergerakan stok.
- Mengurangi stok berdasarkan pesanan yang dibuat.
- Membantu admin memantau ketersediaan bahan.

### 6. Receipt / Printer

- Mencetak struk transaksi pelanggan.
- Mencetak kitchen receipt untuk dapur.
- Mencetak closing receipt.
- Mendukung reprint receipt dari riwayat pesanan.
- Memisahkan format struk berdasarkan jenis receipt.

### 7. Finance / Daily Closing

- Membuka sesi kas.
- Menutup sesi kas harian.
- Menampilkan ringkasan transaksi.
- Menampilkan laporan cash closing.
- Mencatat selisih kas apabila terjadi perbedaan antara expected cash dan actual cash.

### 8. Audit Log

- Mencatat aktivitas penting pada sistem.
- Mendukung pencatatan aktivitas void order.
- Membantu proses pelacakan perubahan transaksi tertentu.

---

## Teknologi yang Digunakan

| Bagian | Teknologi |
|---|---|
| Frontend | Next.js / React |
| Backend | Fastify |
| Database | PostgreSQL |
| ORM | Prisma |
| Package Manager | pnpm |
| Version Control | Git & GitHub |
| CI/CD | GitHub Actions |
| Linter | ESLint |
| Container | Docker Compose |

---

## Cara Menjalankan Aplikasi

### 1. Clone Repository

```bash
git clone https://github.com/bliDedok/kanovi.git
cd kanovi
```

### 2. Install Dependency

```bash
pnpm install
```

### 3. Siapkan Environment

Copy file environment example.

```bash
cp .env.example .env
```

Sesuaikan konfigurasi database pada file .env.

Contoh konfigurasi:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kanovi"
```

### 4. Jalankan Database dengan Docker

```bash
docker compose up -d
```

### 5. Generate Prisma Client

```bash
pnpm --filter api prisma generate
```

### 6. Jalankan Migrasi Database

```bash
pnpm --filter api prisma migrate dev
```

### 7. Jalankan Seeder Database

```bash
pnpm --filter api seed
```

### 8. Jalankan Aplikasi

```bash
pnpm dev
```

Secara umum aplikasi akan berjalan pada alamat berikut.

```txt
Frontend: http://localhost:3000
Backend : http://localhost:3001
```

---

## Arsitektur Sistem

Kanovi POS System menggunakan pendekatan Layered Architecture. Arsitektur ini dipilih karena sesuai dengan karakteristik sistem Point of Sale yang memiliki alur request-response yang jelas, seperti proses order, pembayaran, inventory, kitchen queue, receipt, void order, printer, dan daily closing.

Layered Architecture digunakan untuk memisahkan tanggung jawab kode ke dalam beberapa lapisan agar sistem lebih mudah dipahami, diuji, dan dikembangkan. Setiap layer memiliki tanggung jawab yang berbeda, sehingga logika bisnis tidak bercampur langsung dengan route, controller, maupun akses database.

Alur arsitektur sistem Kanovi POS adalah sebagai berikut.

```txt
Frontend / UI
      ↓
API Client
      ↓
Route Layer
      ↓
Controller Layer
      ↓
Service / Business Logic Layer
      ↓
Repository / Data Access Layer
      ↓
Prisma ORM
      ↓
PostgreSQL Database
```

### 1. Presentation Layer

Presentation Layer merupakan lapisan antarmuka pengguna. Layer ini bertanggung jawab untuk menampilkan halaman aplikasi dan menerima input dari pengguna.

Contoh fitur pada layer ini:

- Halaman login.
- Halaman kasir / POS.
- Halaman order history.
- Halaman inventory.
- Halaman kitchen queue.
- Halaman finance / daily closing.

Lokasi folder:

```txt
apps/web/
```

### 2. API Client Layer

API Client Layer digunakan pada frontend untuk memusatkan komunikasi dengan backend. Dengan adanya file API client, komponen frontend tidak perlu menulis endpoint backend secara langsung di banyak tempat.

Contoh lokasi file:

```txt
apps/web/src/lib/api.ts
```

Contoh fungsi:

```txt
createOrder()
checkOrderStock()
payOrder()
printKitchenReceipt()
printClosingReceipt()
```

### 3. Route Layer

Route Layer bertanggung jawab untuk mendefinisikan endpoint API. Layer ini menerima request dari frontend, lalu meneruskannya ke controller yang sesuai.

Lokasi folder:

```txt
apps/api/src/routes/
```

Contoh file:

```txt
orderRoutes.ts
financeRoutes.ts
queueRoutes.ts
printerRoutes.ts
```

### 4. Controller Layer

Controller Layer bertanggung jawab untuk menangani request dan response. Controller menerima data dari route, membaca parameter atau body request, melakukan validasi awal, memanggil service, lalu mengembalikan response kepada client.

Lokasi folder:

```txt
apps/api/src/controllers/
```

Contoh file:

```txt
orderController.ts
financeController.ts
queueController.ts
printerController.ts
```

### 5. Service / Business Logic Layer

Service Layer berisi logika bisnis utama aplikasi. Pada layer ini terdapat proses seperti pembuatan order, penghitungan pembayaran, validasi stok, pengurangan stok bahan, void order, reprint receipt, pencetakan struk, dan daily closing.

Lokasi folder:

```txt
apps/api/src/services/
```

Contoh tanggung jawab service:

- Mengatur alur pembuatan order.
- Menghitung total transaksi.
- Memproses pembayaran.
- Mengelola pengurangan stok.
- Menangani proses closing kas harian.
- Menjalankan aturan bisnis void order.
- Mengatur proses pencetakan receipt.

### 6. Repository / Data Access Layer

Repository Layer bertanggung jawab untuk mengakses database. Layer ini menjadi penghubung antara service dan database. Dengan adanya repository, service tidak perlu langsung bergantung pada query Prisma.

Lokasi folder:

```txt
apps/api/src/repositories/
```

Contoh tanggung jawab repository:

- Menyimpan order ke database.
- Mengambil data menu.
- Mengambil data stok bahan.
- Menyimpan cash session.
- Mengambil riwayat transaksi.

### 7. Infrastructure Layer

Infrastructure Layer berisi konfigurasi teknis yang mendukung aplikasi, seperti ORM, koneksi database, schema database, dan adapter teknis.

Lokasi file:

```txt
apps/api/src/prisma.ts
apps/api/prisma/schema.prisma
apps/api/src/adapters/
```

Teknologi yang digunakan pada layer ini:

- Prisma ORM.
- PostgreSQL.
- Docker Compose untuk database lokal.
- Printer adapter untuk komunikasi teknis dengan printer thermal.

---

## Struktur Backend Berdasarkan Layer

```txt
apps/api/src/
  routes/
    orderRoutes.ts
    financeRoutes.ts
    queueRoutes.ts
    printerRoutes.ts

  controllers/
    orderController.ts
    financeController.ts
    queueController.ts
    printerController.ts

  services/
    orderService.ts
    financeService.ts
    stockService.ts
    paymentService.ts
    printerService.ts

  repositories/
    orderRepository.ts
    financeRepository.ts
    inventoryRepository.ts

  strategies/
    paymentStrategy.ts
    cashPaymentStrategy.ts
    qrisPaymentStrategy.ts

  factories/
    receiptFactory.ts

  receipts/
    customerReceiptBuilder.ts
    kitchenReceiptBuilder.ts
    closingReceiptBuilder.ts

  adapters/
    printerAdapter.ts

  prisma.ts
```

Keterangan:

- routes/ menangani endpoint API.
- controllers/ menangani request dan response.
- services/ menangani business logic.
- repositories/ menangani akses database.
- strategies/ menangani variasi logika tertentu seperti metode pembayaran.
- factories/ menangani pemilihan builder berdasarkan tipe receipt.
- receipts/ menangani format teks struk.
- adapters/ menangani komunikasi teknis dengan perangkat eksternal.
- prisma.ts menangani koneksi Prisma Client.

---

## Design Pattern yang Digunakan

Pada proyek ini diterapkan beberapa design pattern untuk meningkatkan struktur dan kualitas kode.

| No | Design Pattern | Lokasi File | Tujuan |
|---|---|---|---|
| 1 | Singleton Pattern | apps/api/src/prisma.ts | Memastikan Prisma Client hanya dibuat satu kali dan digunakan bersama pada seluruh backend. |
| 2 | Strategy Pattern | apps/api/src/strategies/paymentStrategy.ts | Memisahkan logika pembayaran berdasarkan metode pembayaran seperti CASH dan QRIS. |
| 3 | Factory Pattern | apps/api/src/factories/receiptFactory.ts | Membuat teks struk berdasarkan tipe receipt yang diminta. |
| 4 | Adapter Pattern | apps/api/src/adapters/printerAdapter.ts | Memisahkan detail teknis printer thermal dari business logic aplikasi. |

### 1. Singleton Pattern

Singleton Pattern digunakan pada konfigurasi Prisma Client. Pattern ini bertujuan agar koneksi database tidak dibuat berulang-ulang pada banyak file. Dengan satu instance Prisma Client, penggunaan koneksi database menjadi lebih terkontrol.

File:

```txt
apps/api/src/prisma.ts
```

Tujuan:

```txt
Menyediakan satu instance Prisma Client yang dapat digunakan oleh seluruh service atau repository.
```

Manfaat:

- Menghindari pembuatan Prisma Client berulang-ulang.
- Membuat koneksi database lebih terkontrol.
- Memusatkan konfigurasi database pada satu file.

### 2. Strategy Pattern

Strategy Pattern digunakan pada proses pembayaran. Setiap metode pembayaran dapat memiliki strategi masing-masing, misalnya CASH dan QRIS. Dengan pattern ini, penambahan metode pembayaran baru dapat dilakukan tanpa mengubah banyak kode utama.

File:

```txt
apps/api/src/strategies/paymentStrategy.ts
apps/api/src/strategies/cashPaymentStrategy.ts
apps/api/src/strategies/qrisPaymentStrategy.ts
```

Tujuan:

```txt
Memisahkan logika pembayaran berdasarkan jenis metode pembayaran agar kode lebih modular dan mudah dikembangkan.
```

Manfaat:

- Memisahkan logika pembayaran berdasarkan metode.
- Memudahkan penambahan metode pembayaran baru.
- Menghindari percabangan kondisi pembayaran yang terlalu panjang.

### 3. Factory Pattern

Factory Pattern digunakan pada fitur receipt/printer. Pattern ini membantu sistem memilih pembuat format struk berdasarkan tipe receipt yang diminta, seperti customer receipt, kitchen receipt, closing receipt, atau test print.

File:

```txt
apps/api/src/factories/receiptFactory.ts
```

Contoh alur:

```ts
const receiptText = ReceiptFactory.createReceiptText("CLOSING", closing);
```

Penjelasan:

```txt
Service mengirim tipe receipt, misalnya CLOSING. ReceiptFactory kemudian memilih builder yang sesuai untuk membuat teks struk closing.
```

Tujuan:

```txt
Memisahkan proses pembuatan teks struk berdasarkan jenis receipt agar service tidak berisi banyak kondisi format struk.
```

Manfaat:

- Format struk lebih mudah dipisahkan.
- Service printer menjadi lebih ringkas.
- Penambahan jenis struk baru dapat dilakukan dengan menambah builder baru.

### 4. Adapter Pattern

Adapter Pattern digunakan pada fitur printer. Pattern ini bertujuan untuk membungkus detail teknis komunikasi dengan printer thermal agar tidak bercampur langsung dengan service utama.

File:

```txt
apps/api/src/adapters/printerAdapter.ts
```

Tujuan:

```txt
Memisahkan detail teknis printer, seperti nama printer, command print, raw printing, dan error handling dari business logic aplikasi.
```

Manfaat:

- Printer service tidak perlu mengetahui detail teknis perangkat printer.
- Jika perangkat printer atau cara cetak berubah, perubahan cukup dilakukan pada adapter.
- Kode menjadi lebih modular dan mudah dirawat.

---

## Alur Fitur Printer Receipt

Salah satu contoh alur pada sistem adalah proses pencetakan closing receipt.

```txt
Frontend
  ↓
api.printClosingReceipt(closing)
  ↓
POST /api/printer/closing-receipt
  ↓
printerRoutes.ts
  ↓
printerController.ts
  ↓
printerService.ts
  ↓
ReceiptFactory.createReceiptText("CLOSING", closing)
  ↓
closingReceiptBuilder.ts
  ↓
printerAdapter.print(receiptText)
  ↓
Thermal Printer
```

Penjelasan:

- Frontend memanggil fungsi printClosingReceipt pada api.ts.
- Fungsi tersebut mengirim data closing ke endpoint /api/printer/closing-receipt.
- Backend menerima request melalui printerRoutes.ts.
- Controller meneruskan request ke printer service.
- Service membuat teks struk melalui ReceiptFactory.
- Factory memilih builder yang sesuai berdasarkan tipe receipt.
- Builder membuat format teks struk.
- Adapter mengirim teks struk ke printer thermal.

---

## Clean Code

Beberapa prinsip clean code yang diterapkan pada proyek ini adalah sebagai berikut.

### 1. Pemisahan Tanggung Jawab

Kode dipisahkan berdasarkan tanggung jawab masing-masing layer:

- Route untuk endpoint.
- Controller untuk request dan response.
- Service untuk business logic.
- Repository untuk akses database.
- Factory untuk memilih format receipt.
- Adapter untuk komunikasi teknis dengan perangkat eksternal.

### 2. Penamaan Fungsi yang Deskriptif

Beberapa contoh penamaan fungsi yang digunakan:

```txt
createOrder()
checkOrderStock()
payOrder()
voidOrder()
printReceipt()
printKitchenReceipt()
printClosingReceipt()
createReceiptText()
buildCustomerReceiptText()
buildKitchenReceiptText()
buildClosingReceiptText()
```

Nama fungsi dibuat sesuai dengan tugasnya agar lebih mudah dipahami oleh anggota tim.

### 3. API Client Terpusat

Pada frontend, komunikasi dengan backend dipusatkan pada file:

```txt
apps/web/src/lib/api.ts
```

Contoh fungsi:

```txt
printClosingReceipt()
createOrder()
payOrder()
checkOrderStock()
```

Dengan cara ini, endpoint backend tidak tersebar langsung di banyak komponen frontend.

### 4. Fungsi Lebih Spesifik

Logika besar dipisahkan ke fungsi yang lebih spesifik. Contohnya pada printer, proses cetak struk customer, kitchen, dan closing dipisahkan agar tidak menumpuk dalam satu fungsi besar.

---

## GitFlow dan Conventional Commit

Pengembangan proyek dilakukan menggunakan alur GitFlow. Branch utama yang digunakan adalah sebagai berikut.

| Branch | Fungsi |
|---|---|
| main | Branch stabil untuk versi final |
| development | Branch integrasi fitur |
| feature/nama-fitur | Branch untuk pengembangan fitur baru |
| fix/nama-perbaikan | Branch untuk perbaikan bug |
| docs/nama-dokumentasi | Branch untuk dokumentasi |
| refactor/nama-refactor | Branch untuk perubahan struktur kode |

Setiap fitur dikembangkan melalui branch terpisah dan digabungkan ke development melalui Pull Request. Pull Request digunakan agar setiap perubahan dapat diperiksa terlebih dahulu sebelum digabungkan.

Format commit yang digunakan mengikuti Conventional Commit, misalnya:

```txt
feat(pos): add order checkout flow
fix(finance): sync branch on closing report
docs(readme): update UAS project documentation
refactor(order): separate service and repository layers
```

---

## Bukti Linter dan Build

Proyek ini menggunakan GitHub Actions untuk menjalankan proses pemeriksaan kode secara otomatis.

Workflow CI menjalankan beberapa tahap berikut:

```txt
pnpm install
pnpm --filter api prisma generate
pnpm lint
pnpm build
```

Untuk menjalankan pengecekan secara lokal:

```bash
pnpm lint
pnpm build
```

Hasil linter dan build digunakan sebagai bukti bahwa kode bersih dari error linter dan dapat dibangun dengan baik sebelum dikumpulkan.

Contoh hasil linter lokal:

```txt
apps/api lint$ eslint .
Done

apps/web lint$ next lint
✔ No ESLint warnings or errors
Done
```

Contoh hasil build lokal:

```txt
apps/api build$ tsc -p tsconfig.json
Done

apps/web build$ next build
Done
```

---

## Status Pengembangan

Status proyek saat ini adalah Minimum Viable Product (MVP). Fitur utama sistem telah dikembangkan untuk mendukung kebutuhan transaksi POS, pengelolaan pesanan, inventory, receipt, printer, void order, dan daily closing.

Pengembangan selanjutnya dapat diarahkan pada:

- Peningkatan UI/UX.
- Optimasi laporan finance.
- Integrasi printer yang lebih lengkap.
- Penguatan testing otomatis.
- Penambahan role access yang lebih detail.
- Integrasi metode pembayaran tambahan.
