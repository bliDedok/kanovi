import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Mulai melakukan seeding 4 data user (PIN Mode)...');

  // 1. Hash password angka PIN (6 digit)
  const passwordOwner = await bcrypt.hash('123456', 10);
  const passwordPegawai = await bcrypt.hash('654321', 10); // PIN Kasir

  // 2. Data 2 Owner (Novi & Dimas)
  await prisma.user.upsert({
    where: { username: 'novi' },
    // PERBAIKAN: Masukkan passwordOwner ke dalam update
    update: { password: passwordOwner }, 
    create: { username: 'novi', password: passwordOwner, role: 'OWNER', name: 'Kak Novi', location: 'COUNTER' },
  });

  await prisma.user.upsert({
    where: { username: 'dimas' },
    // PERBAIKAN: Masukkan passwordOwner ke dalam update
    update: { password: passwordOwner }, 
    create: { username: 'dimas', password: passwordOwner, role: 'OWNER', name: 'Kak Dimas', location: 'COUNTER' },
  });

  // 3. Data 2 Pegawai (Diah & Reza)
  await prisma.user.upsert({
    where: { username: 'diah' },
    // PERBAIKAN: Masukkan passwordPegawai ke dalam update
    update: { password: passwordPegawai },
    create: { username: 'diah', password: passwordPegawai, role: 'PEGAWAI', name: 'Kak Diah', location: 'COUNTER' },
  });

  await prisma.user.upsert({
    where: { username: 'reza' }, 
    // PERBAIKAN: Masukkan passwordPegawai ke dalam update
    update: { password: passwordPegawai },
    create: { username: 'reza', password: passwordPegawai, role: 'PEGAWAI', name: 'Kak Reza', location: 'COUNTER' },
  });

  console.log('Seeding PIN berhasil diupdate! 🎉');
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });