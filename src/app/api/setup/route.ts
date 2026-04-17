import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { INGREDIENTS } from "@/constants/products";

export async function GET() {
  try {
    // 1. Cek koneksi
    await prisma.$connect();

    // 2. Buat tabel secara manual jika belum ada (Raw SQL)
    // Ini membantu jika user tidak bisa menjalankan 'npx prisma db push'
    const tables = [
      `CREATE TABLE IF NOT EXISTS "Cashier" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Cashier_pkey" PRIMARY KEY ("id")
      );`,
      `CREATE TABLE IF NOT EXISTS "Ingredient" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "stock" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
      );`,
      `CREATE TABLE IF NOT EXISTS "Transaction" (
          "id" TEXT NOT NULL,
          "cashierName" TEXT NOT NULL,
          "total" INTEGER NOT NULL,
          "paymentMethod" TEXT NOT NULL DEFAULT 'TUNAI',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
      );`,
      `CREATE TABLE IF NOT EXISTS "TransactionItem" (
          "id" TEXT NOT NULL,
          "transactionId" TEXT NOT NULL,
          "productName" TEXT NOT NULL,
          "quantity" INTEGER NOT NULL,
          "price" INTEGER NOT NULL,
          CONSTRAINT "TransactionItem_pkey" PRIMARY KEY ("id")
      );`,
      `CREATE TABLE IF NOT EXISTS "StockHistory" (
          "id" TEXT NOT NULL,
          "ingredientName" TEXT NOT NULL,
          "change" INTEGER NOT NULL,
          "type" TEXT NOT NULL DEFAULT 'ADD',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "StockHistory_pkey" PRIMARY KEY ("id")
      );`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Ingredient_name_key" ON "Ingredient"("name");`,
      // Add foreign key constraint carefully (check if exists or use try-catch)
    ];

    for (const sql of tables) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (e) {
        console.log("SQL execution skipped or failed (might already exist):", sql.substring(0, 50));
      }
    }

    // 3. Seed Ingredients
    for (const name of INGREDIENTS) {
      await prisma.ingredient.upsert({
        where: { name },
        update: {},
        create: { name, stock: 0 },
      });
    }

    // 4. Seed Cashiers
    const cashierCount = await prisma.cashier.count();
    if (cashierCount === 0) {
      await prisma.cashier.createMany({
        data: [
          { name: "Naufal" },
          { name: "Sari" },
          { name: "Ade" },
        ],
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Database berhasil disinkronkan! Tabel dan data awal telah dibuat." 
    });
  } catch (error: any) {
    console.error("Setup Error:", error);
    
    let userMessage = "Gagal menyinkronkan database.";
    if (error.message.includes("FATAL: Tenant or user not found")) {
      userMessage = "Project ID Supabase salah atau Region tidak sesuai.";
    } else if (error.message.includes("Can't reach database server")) {
      userMessage = "Tidak bisa menghubungi server database. Cek koneksi internet atau firewall Supabase.";
    } else if (error.message.includes("Password authentication failed")) {
      userMessage = "Password database salah. Pastikan password di DATABASE_URL benar.";
    }

    return NextResponse.json({ 
      success: false, 
      error: userMessage,
      detail: error.message 
    }, { status: 500 });
  }
}
