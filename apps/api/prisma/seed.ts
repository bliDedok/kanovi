import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Mulai melakukan seeding data Kanovi...');

  // ==========================================
  // 1. SEED USERS
  // ==========================================
  console.log('Seeding Users...');
  const passwordOwner = await bcrypt.hash('123456', 10);
  const passwordPegawai = await bcrypt.hash('654321', 10);

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


  // ==========================================
  // 2. SEED KATEGORI
  // ==========================================
  console.log('Seeding Kategori...');
  const catMinuman = await prisma.category.upsert({
    where: { slug: 'minuman' },
    update: {},
    create: { name: 'Minuman', slug: 'minuman', sortOrder: 1 },
  });

  const catMakanan = await prisma.category.upsert({
    where: { slug: 'makanan' },
    update: {},
    create: { name: 'Makanan', slug: 'makanan', sortOrder: 2 },
  });


  // ==========================================
  // 3. SEED INGREDIENTS (BAHAN BAKU)
  // ==========================================
  console.log('Seeding Bahan Baku (Ingredients)...');
  const ingKopi = await prisma.ingredient.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Biji Kopi Espresso', stock: 5000, unit: 'gram', minStock: 500 },
  });

  const ingSusu = await prisma.ingredient.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: 'Susu Fresh Milk', stock: 10000, unit: 'ml', minStock: 1000 },
  });

  const ingGula = await prisma.ingredient.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, name: 'Gula Cair', stock: 3000, unit: 'ml', minStock: 500 },
  });

  const ingTeh = await prisma.ingredient.upsert({
    where: { id: 4 },
    update: {},
    create: { id: 4, name: 'Daun Teh Hitam', stock: 2000, unit: 'gram', minStock: 200 },
  });

  const ingRoti = await prisma.ingredient.upsert({
    where: { id: 5 },
    update: {},
    create: { id: 5, name: 'Roti Tawar Tebal', stock: 50, unit: 'pcs', minStock: 10 },
  });


  // ==========================================
  // 4. SEED MENU
  // ==========================================
  console.log('Seeding Menu...');
  const menuKopiSusu = await prisma.menu.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Es Kopi Susu Kanovi",
      price: 20000,
      categoryId: catMinuman.id,
      prepStation: "KITCHEN",
    },
  });

  const menuTehManis = await prisma.menu.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: "Es Teh Manis",
      price: 12000,
      categoryId: catMinuman.id,
      prepStation: "KITCHEN",
    },
  });

  const menuRotiBakar = await prisma.menu.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: "Roti Bakar Coklat",
      price: 18000,
      categoryId: catMakanan.id,
      prepStation: "KITCHEN",
    },
  });


  // ==========================================
  // 5. SEED RECIPES (RESEP & POTONGAN STOK)
  // ==========================================
  console.log('Seeding Resep...');
  
  // Resep Es Kopi Susu: Butuh 15g Kopi, 150ml Susu, 20ml Gula
  await prisma.recipe.upsert({
    where: { menuId_ingredientId: { menuId: menuKopiSusu.id, ingredientId: ingKopi.id } },
    update: {}, create: { menuId: menuKopiSusu.id, ingredientId: ingKopi.id, amountNeeded: 15 }
  });
  await prisma.recipe.upsert({
    where: { menuId_ingredientId: { menuId: menuKopiSusu.id, ingredientId: ingSusu.id } },
    update: {}, create: { menuId: menuKopiSusu.id, ingredientId: ingSusu.id, amountNeeded: 150 }
  });
  await prisma.recipe.upsert({
    where: { menuId_ingredientId: { menuId: menuKopiSusu.id, ingredientId: ingGula.id } },
    update: {}, create: { menuId: menuKopiSusu.id, ingredientId: ingGula.id, amountNeeded: 20 }
  });

  // Resep Es Teh Manis: Butuh 10g Teh, 30ml Gula
  await prisma.recipe.upsert({
    where: { menuId_ingredientId: { menuId: menuTehManis.id, ingredientId: ingTeh.id } },
    update: {}, create: { menuId: menuTehManis.id, ingredientId: ingTeh.id, amountNeeded: 10 }
  });
  await prisma.recipe.upsert({
    where: { menuId_ingredientId: { menuId: menuTehManis.id, ingredientId: ingGula.id } },
    update: {}, create: { menuId: menuTehManis.id, ingredientId: ingGula.id, amountNeeded: 30 }
  });

  // Resep Roti Bakar: Butuh 2 pcs Roti
  await prisma.recipe.upsert({
    where: { menuId_ingredientId: { menuId: menuRotiBakar.id, ingredientId: ingRoti.id } },
    update: {}, create: { menuId: menuRotiBakar.id, ingredientId: ingRoti.id, amountNeeded: 2 }
  });

  console.log('Seeding Data Berhasil! 🎉 Silakan refresh halaman POS.');
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => { 
    console.error(e); 
    await prisma.$disconnect(); 
    process.exit(1); 
  });