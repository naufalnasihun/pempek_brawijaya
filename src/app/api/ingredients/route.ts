import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { INGREDIENTS } from "@/constants/products";

export async function GET() {
  try {
    // Ensure all ingredients exist in DB
    for (const name of INGREDIENTS) {
      await prisma.ingredient.upsert({
        where: { name },
        update: {},
        create: { name, stock: 0 },
      });
    }

    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(ingredients);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch ingredients" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, stockChange } = await req.json();
    if (!name || stockChange === undefined) {
      return NextResponse.json({ error: "Name and stockChange are required" }, { status: 400 });
    }

    const updatedIngredient = await prisma.ingredient.update({
      where: { name },
      data: {
        stock: { increment: stockChange },
      },
    });

    await prisma.stockHistory.create({
      data: {
        ingredientName: name,
        change: stockChange,
        type: stockChange >= 0 ? "ADD" : "REDUCE",
      },
    });

    return NextResponse.json(updatedIngredient);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update stock" }, { status: 500 });
  }
}
