import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function resetSequence(tableName: string) {
  try {
    await prisma.$executeRawUnsafe(`
      SELECT setval(
        pg_get_serial_sequence('"${tableName}"', 'id'),
        COALESCE((SELECT MAX(id) FROM "${tableName}"), 1),
        (SELECT MAX(id) IS NOT NULL FROM "${tableName}")
      );
    `);

    console.log(`Sequence ${tableName}.id berhasil di-reset.`);
  } catch (error) {
    console.warn(`Skip reset sequence untuk tabel ${tableName}:`, error);
  }
}

async function main() {
  console.log("Mulai melakukan seeding data Kanovi...");

  // ==========================================
  // 1. SEED USERS
  // ==========================================
  console.log("Seeding Users...");

  const passwordOwner = await bcrypt.hash("123456", 10);
  const passwordPegawai = await bcrypt.hash("654321", 10);

  await prisma.user.upsert({
    where: { username: "novi" },
    update: {
      password: passwordOwner,
      role: "OWNER",
      name: "Kak Novi",
      location: "COUNTER",
    },
    create: {
      username: "novi",
      password: passwordOwner,
      role: "OWNER",
      name: "Kak Novi",
      location: "COUNTER",
    },
  });

  await prisma.user.upsert({
    where: { username: "dimas" },
    update: {
      password: passwordOwner,
      role: "OWNER",
      name: "Kak Dimas",
      location: "COUNTER",
    },
    create: {
      username: "dimas",
      password: passwordOwner,
      role: "OWNER",
      name: "Kak Dimas",
      location: "COUNTER",
    },
  });

  await prisma.user.upsert({
    where: { username: "diah" },
    update: {
      password: passwordPegawai,
      role: "PEGAWAI",
      name: "Kak Diah",
      location: "COUNTER",
    },
    create: {
      username: "diah",
      password: passwordPegawai,
      role: "PEGAWAI",
      name: "Kak Diah",
      location: "COUNTER",
    },
  });

  await prisma.user.upsert({
    where: { username: "reza" },
    update: {
      password: passwordPegawai,
      role: "PEGAWAI",
      name: "Kak Reza",
      location: "COUNTER",
    },
    create: {
      username: "reza",
      password: passwordPegawai,
      role: "PEGAWAI",
      name: "Kak Reza",
      location: "COUNTER",
    },
  });

  // ==========================================
  // 2. SEED KATEGORI
  // ==========================================
  console.log("Seeding Kategori...");

  const catMinuman = await prisma.category.upsert({
    where: { slug: "minuman" },
    update: {
      name: "Minuman",
      sortOrder: 1,
      isActive: true,
    },
    create: {
      name: "Minuman",
      slug: "minuman",
      sortOrder: 1,
      isActive: true,
    },
  });

  const catMakanan = await prisma.category.upsert({
    where: { slug: "makanan" },
    update: {
      name: "Makanan",
      sortOrder: 2,
      isActive: true,
    },
    create: {
      name: "Makanan",
      slug: "makanan",
      sortOrder: 2,
      isActive: true,
    },
  });

  const catDessert = await prisma.category.upsert({
    where: { slug: "dessert" },
    update: {
      name: "Dessert",
      sortOrder: 3,
      isActive: true,
    },
    create: {
      name: "Dessert",
      slug: "dessert",
      sortOrder: 3,
      isActive: true,
    },
  });

  // ==========================================
  // 3. SEED INGREDIENTS
  // ==========================================
  console.log("Seeding Bahan Baku...");

  const ingredients = [
    {
      id: 1,
      name: "Biji Kopi Espresso",
      stock: 7000,
      unit: "gram",
      minStock: 500,
    },
    {
      id: 2,
      name: "Susu Fresh Milk",
      stock: 15000,
      unit: "ml",
      minStock: 1000,
    },
    {
      id: 3,
      name: "Gula Cair",
      stock: 6000,
      unit: "ml",
      minStock: 500,
    },
    {
      id: 4,
      name: "Daun Teh Hitam",
      stock: 3000,
      unit: "gram",
      minStock: 200,
    },
    {
      id: 5,
      name: "Roti Tawar Tebal",
      stock: 80,
      unit: "pcs",
      minStock: 10,
    },
    {
      id: 6,
      name: "Coklat Spread",
      stock: 4000,
      unit: "gram",
      minStock: 500,
    },
    {
      id: 7,
      name: "Matcha Powder",
      stock: 2500,
      unit: "gram",
      minStock: 300,
    },
    {
      id: 8,
      name: "Caramel Syrup",
      stock: 3500,
      unit: "ml",
      minStock: 400,
    },
    {
      id: 9,
      name: "Vanilla Syrup",
      stock: 3500,
      unit: "ml",
      minStock: 400,
    },
    {
      id: 10,
      name: "Strawberry Syrup",
      stock: 3000,
      unit: "ml",
      minStock: 400,
    },
    {
      id: 11,
      name: "Lemon",
      stock: 70,
      unit: "pcs",
      minStock: 10,
    },
    {
      id: 12,
      name: "Air Mineral",
      stock: 20000,
      unit: "ml",
      minStock: 2000,
    },
    {
      id: 13,
      name: "Es Batu",
      stock: 30000,
      unit: "gram",
      minStock: 3000,
    },
    {
      id: 14,
      name: "Keju Parut",
      stock: 2500,
      unit: "gram",
      minStock: 300,
    },
    {
      id: 15,
      name: "Telur",
      stock: 80,
      unit: "pcs",
      minStock: 10,
    },
    {
      id: 16,
      name: "Mie Instan",
      stock: 60,
      unit: "pcs",
      minStock: 10,
    },
    {
      id: 17,
      name: "Nasi Putih",
      stock: 8000,
      unit: "gram",
      minStock: 1000,
    },
    {
      id: 18,
      name: "Ayam Suwir",
      stock: 5000,
      unit: "gram",
      minStock: 500,
    },
    {
      id: 19,
      name: "Sosis",
      stock: 70,
      unit: "pcs",
      minStock: 10,
    },
    {
      id: 20,
      name: "Whipped Cream",
      stock: 3000,
      unit: "gram",
      minStock: 300,
    },
  ];

  for (const ingredient of ingredients) {
    await prisma.ingredient.upsert({
      where: { id: ingredient.id },
      update: {
        name: ingredient.name,
        stock: ingredient.stock,
        unit: ingredient.unit,
        minStock: ingredient.minStock,
      },
      create: {
        id: ingredient.id,
        name: ingredient.name,
        stock: ingredient.stock,
        unit: ingredient.unit,
        minStock: ingredient.minStock,
      },
    });
  }

  // ==========================================
  // 4. SEED MENU
  // ==========================================
  console.log("Seeding Menu...");

  const menus = [
    {
      id: 1,
      name: "Es Kopi Susu Kanovi",
      price: 20000,
      categoryId: catMinuman.id,
      prepStation: "KITCHEN",
      isAvailable: true,
    },
    {
      id: 2,
      name: "Americano Ice",
      price: 18000,
      categoryId: catMinuman.id,
      prepStation: "KITCHEN",
      isAvailable: true,
    },
    {
      id: 3,
      name: "Cappuccino Hot",
      price: 22000,
      categoryId: catMinuman.id,
      prepStation: "KITCHEN",
      isAvailable: true,
    },
    {
      id: 4,
      name: "Caramel Latte",
      price: 25000,
      categoryId: catMinuman.id,
      prepStation: "KITCHEN",
      isAvailable: true,
    },
    {
      id: 5,
      name: "Vanilla Latte",
      price: 25000,
      categoryId: catMinuman.id,
      prepStation: "KITCHEN",
      isAvailable: true,
    },
    {
      id: 6,
      name: "Es Teh Manis",
      price: 12000,
      categoryId: catMinuman.id,
      prepStation: "KITCHEN",
      isAvailable: true,
    },
    {
      id: 7,
      name: "Lemon Tea Ice",
      price: 16000,
      categoryId: catMinuman.id,
      prepStation: "KITCHEN",
      isAvailable: true,
    },
    {
      id: 8,
      name: "Matcha Latte Ice",
      price: 24000,
      categoryId: catMinuman.id,
      prepStation: "KITCHEN",
      isAvailable: true,
    },
    {
      id: 9,
      name: "Chocolate Milk Ice",
      price: 22000,
      categoryId: catMinuman.id,
      prepStation: "KITCHEN",
      isAvailable: true,
    },
    {
      id: 10,
      name: "Strawberry Milk",
      price: 22000,
      categoryId: catMinuman.id,
      prepStation: "KITCHEN",
      isAvailable: true,
    },
    {
      id: 11,
      name: "Roti Bakar Coklat",
      price: 18000,
      categoryId: catMakanan.id,
      prepStation: "KITCHEN",
      isAvailable: true,
    },
    {
      id: 12,
      name: "Roti Bakar Keju",
      price: 20000,
      categoryId: catMakanan.id,
      prepStation: "KITCHEN",
      isAvailable: true,
    },
    {
      id: 13,
      name: "Roti Bakar Coklat Keju",
      price: 23000,
      categoryId: catMakanan.id,
      prepStation: "KITCHEN",
      isAvailable: true,
    },
    {
      id: 14,
      name: "Mie Goreng Telur",
      price: 18000,
      categoryId: catMakanan.id,
      prepStation: "KITCHEN",
      isAvailable: true,
    },
    {
      id: 15,
      name: "Mie Goreng Sosis",
      price: 22000,
      categoryId: catMakanan.id,
      prepStation: "KITCHEN",
      isAvailable: true,
    },
    {
      id: 16,
      name: "Nasi Ayam Suwir",
      price: 25000,
      categoryId: catMakanan.id,
      prepStation: "KITCHEN",
      isAvailable: true,
    },
    {
      id: 17,
      name: "Nasi Telur Sosis",
      price: 23000,
      categoryId: catMakanan.id,
      prepStation: "KITCHEN",
      isAvailable: true,
    },
    {
      id: 18,
      name: "Toast Strawberry Cream",
      price: 24000,
      categoryId: catDessert.id,
      prepStation: "KITCHEN",
      isAvailable: true,
    },
    {
      id: 19,
      name: "Choco Cheese Toast",
      price: 25000,
      categoryId: catDessert.id,
      prepStation: "KITCHEN",
      isAvailable: true,
    },
    {
      id: 20,
      name: "Kanovi Sweet Toast",
      price: 27000,
      categoryId: catDessert.id,
      prepStation: "KITCHEN",
      isAvailable: true,
    },
  ];

  for (const menu of menus) {
    await prisma.menu.upsert({
      where: { id: menu.id },
      update: {
        name: menu.name,
        price: menu.price,
        categoryId: menu.categoryId,
        prepStation: menu.prepStation as any,
        isAvailable: menu.isAvailable,
      },
      create: {
        id: menu.id,
        name: menu.name,
        price: menu.price,
        categoryId: menu.categoryId,
        prepStation: menu.prepStation as any,
        isAvailable: menu.isAvailable,
      },
    });
  }

  // ==========================================
  // 5. SEED RECIPES
  // ==========================================
  console.log("Seeding Resep...");

  const recipes = [
    { menuId: 1, ingredientId: 1, amountNeeded: 15 },
    { menuId: 1, ingredientId: 2, amountNeeded: 150 },
    { menuId: 1, ingredientId: 3, amountNeeded: 20 },
    { menuId: 1, ingredientId: 13, amountNeeded: 120 },

    { menuId: 2, ingredientId: 1, amountNeeded: 18 },
    { menuId: 2, ingredientId: 12, amountNeeded: 180 },
    { menuId: 2, ingredientId: 13, amountNeeded: 120 },

    { menuId: 3, ingredientId: 1, amountNeeded: 18 },
    { menuId: 3, ingredientId: 2, amountNeeded: 180 },

    { menuId: 4, ingredientId: 1, amountNeeded: 18 },
    { menuId: 4, ingredientId: 2, amountNeeded: 160 },
    { menuId: 4, ingredientId: 8, amountNeeded: 25 },
    { menuId: 4, ingredientId: 13, amountNeeded: 100 },

    { menuId: 5, ingredientId: 1, amountNeeded: 18 },
    { menuId: 5, ingredientId: 2, amountNeeded: 160 },
    { menuId: 5, ingredientId: 9, amountNeeded: 25 },
    { menuId: 5, ingredientId: 13, amountNeeded: 100 },

    { menuId: 6, ingredientId: 4, amountNeeded: 10 },
    { menuId: 6, ingredientId: 3, amountNeeded: 30 },
    { menuId: 6, ingredientId: 12, amountNeeded: 180 },
    { menuId: 6, ingredientId: 13, amountNeeded: 100 },

    { menuId: 7, ingredientId: 4, amountNeeded: 10 },
    { menuId: 7, ingredientId: 3, amountNeeded: 20 },
    { menuId: 7, ingredientId: 11, amountNeeded: 1 },
    { menuId: 7, ingredientId: 12, amountNeeded: 160 },
    { menuId: 7, ingredientId: 13, amountNeeded: 100 },

    { menuId: 8, ingredientId: 7, amountNeeded: 20 },
    { menuId: 8, ingredientId: 2, amountNeeded: 180 },
    { menuId: 8, ingredientId: 3, amountNeeded: 20 },
    { menuId: 8, ingredientId: 13, amountNeeded: 100 },

    { menuId: 9, ingredientId: 6, amountNeeded: 35 },
    { menuId: 9, ingredientId: 2, amountNeeded: 180 },
    { menuId: 9, ingredientId: 13, amountNeeded: 100 },

    { menuId: 10, ingredientId: 10, amountNeeded: 30 },
    { menuId: 10, ingredientId: 2, amountNeeded: 180 },
    { menuId: 10, ingredientId: 13, amountNeeded: 100 },

    { menuId: 11, ingredientId: 5, amountNeeded: 2 },
    { menuId: 11, ingredientId: 6, amountNeeded: 35 },

    { menuId: 12, ingredientId: 5, amountNeeded: 2 },
    { menuId: 12, ingredientId: 14, amountNeeded: 35 },

    { menuId: 13, ingredientId: 5, amountNeeded: 2 },
    { menuId: 13, ingredientId: 6, amountNeeded: 30 },
    { menuId: 13, ingredientId: 14, amountNeeded: 30 },

    { menuId: 14, ingredientId: 16, amountNeeded: 1 },
    { menuId: 14, ingredientId: 15, amountNeeded: 1 },

    { menuId: 15, ingredientId: 16, amountNeeded: 1 },
    { menuId: 15, ingredientId: 19, amountNeeded: 2 },

    { menuId: 16, ingredientId: 17, amountNeeded: 250 },
    { menuId: 16, ingredientId: 18, amountNeeded: 80 },

    { menuId: 17, ingredientId: 17, amountNeeded: 250 },
    { menuId: 17, ingredientId: 15, amountNeeded: 1 },
    { menuId: 17, ingredientId: 19, amountNeeded: 2 },

    { menuId: 18, ingredientId: 5, amountNeeded: 2 },
    { menuId: 18, ingredientId: 10, amountNeeded: 30 },
    { menuId: 18, ingredientId: 20, amountNeeded: 25 },

    { menuId: 19, ingredientId: 5, amountNeeded: 2 },
    { menuId: 19, ingredientId: 6, amountNeeded: 30 },
    { menuId: 19, ingredientId: 14, amountNeeded: 30 },

    { menuId: 20, ingredientId: 5, amountNeeded: 2 },
    { menuId: 20, ingredientId: 6, amountNeeded: 25 },
    { menuId: 20, ingredientId: 8, amountNeeded: 20 },
    { menuId: 20, ingredientId: 20, amountNeeded: 25 },
  ];

  for (const recipe of recipes) {
    await prisma.recipe.upsert({
      where: {
        menuId_ingredientId: {
          menuId: recipe.menuId,
          ingredientId: recipe.ingredientId,
        },
      },
      update: {
        amountNeeded: recipe.amountNeeded,
      },
      create: {
        menuId: recipe.menuId,
        ingredientId: recipe.ingredientId,
        amountNeeded: recipe.amountNeeded,
      },
    });
  }

  // ==========================================
  // 6. RESET AUTO INCREMENT SEQUENCE
  // ==========================================
  console.log("Reset sequence auto-increment...");

  await resetSequence("User");
  await resetSequence("Category");
  await resetSequence("Ingredient");
  await resetSequence("Menu");
  await resetSequence("Recipe");
  await resetSequence("Order");
  await resetSequence("OrderDetail");
  await resetSequence("StockMovement");
  await resetSequence("CashSession");
  await resetSequence("Expense");

  console.log("Seeding Data Berhasil! 🎉 Silakan refresh halaman POS.");
  console.log("Akun demo:");
  console.log("- Owner: novi / 123456");
  console.log("- Owner: dimas / 123456");
  console.log("- Pegawai: diah / 654321");
  console.log("- Pegawai: reza / 654321");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed gagal:", error);
    await prisma.$disconnect();
    process.exit(1);
  });