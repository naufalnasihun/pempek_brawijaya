import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { PRODUCTS } from "@/constants/products";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date"); // YYYY-MM-DD
  const monthStr = searchParams.get("month"); // YYYY-MM

  try {
    let whereClause = {};

    if (dateStr) {
      const startOfDay = new Date(dateStr);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateStr);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause = {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      };
    } else if (monthStr) {
      const [year, month] = monthStr.split("-").map(Number);
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
      whereClause = {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { cashierName, items, paymentMethod, total } = await req.json();

    if (!cashierName || !items || items.length === 0) {
      return NextResponse.json({ error: "Invalid transaction data" }, { status: 400 });
    }

    // 1. Calculate total ingredient consumption
    const consumption: Record<string, number> = {};
    for (const item of items) {
      const product = PRODUCTS.find((p) => p.name === item.productName);
      if (!product) continue;

      for (const ing of product.ingredients) {
        consumption[ing.name] = (consumption[ing.name] || 0) + ing.quantity * item.quantity;
      }
    }

    // 2. Start Prisma Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check and Reduce Stock
      for (const [name, qty] of Object.entries(consumption)) {
        const ingredient = await tx.ingredient.findUnique({
          where: { name },
        });

        if (!ingredient || ingredient.stock < qty) {
          throw new Error(`Stok ${name} tidak cukup!`);
        }

        await tx.ingredient.update({
          where: { name },
          data: { stock: { decrement: qty } },
        });

        await tx.stockHistory.create({
          data: {
            ingredientName: name,
            change: -qty,
            type: "REDUCE",
          },
        });
      }

      // Create Transaction
      const transaction = await tx.transaction.create({
        data: {
          cashierName,
          total,
          paymentMethod,
          items: {
            create: items.map((item: any) => ({
              productName: item.productName,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: { items: true },
      });

      return transaction;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error.message || "Checkout failed" }, { status: 400 });
  }
}
