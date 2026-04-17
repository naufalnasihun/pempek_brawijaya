import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { INGREDIENTS } from "@/constants/products";

export async function GET() {
  try {
    // 1. Cek koneksi
    await prisma.$connect();

    // 2. Seed Ingredients
    for (const name of INGREDIENTS) {
      await prisma.ingredient.upsert({
        where: { name },
        update: {},
        create: { name, stock: 0 },
      });
    }

    // 3. Seed Cashiers
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
    return NextResponse.json({ 
      success: false, 
      error: "Gagal menyinkronkan database.",
      detail: error.message 
    }, { status: 500 });
  }
}
