import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Mulai melakukan seeding 4 data user...');

  // 1. Hash password
  const passwordOwner = await bcrypt.hash('owner123', 10);
  const passwordPegawai = await bcrypt.hash('kasir123', 10);

  // 2. Data 2 Owner (Novi & Dimas)
  await prisma.user.upsert({
    where: { username: 'novi' },
    update: {}, 
    create: { username: 'novi', password: passwordOwner, role: 'OWNER', name: 'Kak Novi', location: 'COUNTER' },
  });

  await prisma.user.upsert({
    where: { username: 'dimas' },
    update: {}, 
    create: { username: 'dimas', password: passwordOwner, role: 'OWNER', name: 'Kak Dimas', location: 'COUNTER' },
  });

  // 3. Data 2 Pegawai (Diah & Pegawai 2)
  await prisma.user.upsert({
    where: { username: 'diah' },
    update: {},
    create: { username: 'diah', password: passwordPegawai, role: 'PEGAWAI', name: 'Kak Diah', location: 'KITCHEN' },
  });

  await prisma.user.upsert({
    where: { username: 'reza' }, // Ganti nama ini kalau kamu ada nama asli pegawainya
    update: {},
    create: { username: 'reza', password: passwordPegawai, role: 'PEGAWAI', name: 'Kak Reza', location: 'KITCHEN' },
  });

  console.log('Seeding 4 user berhasil! 🎉');
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });