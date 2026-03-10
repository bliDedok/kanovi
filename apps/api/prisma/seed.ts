import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Mulai melakukan seeding 4 data user (PIN Mode)...');

  const passwordOwner = await bcrypt.hash('123456', 10);
  const passwordPegawai = await bcrypt.hash('654321', 10);

  // 1. Seed Users (Data yang sudah kamu punya)
  await prisma.user.upsert({
    where: { username: 'novi' },
    update: { password: passwordOwner }, 
    create: { username: 'novi', password: passwordOwner, role: 'OWNER', name: 'Kak Novi', location: 'COUNTER' },
  });

  await prisma.user.upsert({
    where: { username: 'dimas' },
    update: { password: passwordOwner }, 
    create: { username: 'dimas', password: passwordOwner, role: 'OWNER', name: 'Kak Dimas', location: 'COUNTER' },
  });

  await prisma.user.upsert({
    where: { username: 'diah' },
    update: { password: passwordPegawai },
    create: { username: 'diah', password: passwordPegawai, role: 'PEGAWAI', name: 'Kak Diah', location: 'COUNTER' },
  });

  await prisma.user.upsert({
    where: { username: 'reza' }, 
    update: { password: passwordPegawai },
    create: { username: 'reza', password: passwordPegawai, role: 'PEGAWAI', name: 'Kak Reza', location: 'COUNTER' },
  });

  console.log('Seeding PIN berhasil! 🎉');

  // 2. TAMBAHKAN SEED PRODUCT DI SINI
// ... kode user tetap sama di atas ...

console.log('Mulai melakukan seeding data Menu...');

// Cari bagian loop produk di seed.ts kamu, ganti dengan ini:
const menuItems = [
  { name: 'Kopi Susu Kanovi', price: 18000 },
  { name: 'Americano Ice', price: 15000 },
  { name: 'Cafe Latte', price: 22000 },
  { name: 'Matcha Latte', price: 25000 },
];

for (const item of menuItems) {
  await prisma.menu.upsert({
    where: { id: 0 }, // id 0 tidak akan ketemu, jadi dia akan selalu lari ke create
    update: {}, 
    create: {
      name: item.name,
      price: item.price,
    },
  });
}

console.log('Seeding Menu berhasil! ☕✨');
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => { 
    console.error(e); 
    await prisma.$disconnect(); 
    process.exit(1); 
  });