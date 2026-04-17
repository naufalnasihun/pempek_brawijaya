import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Auto-seed default cashiers if table is empty
    const count = await prisma.cashier.count();
    if (count === 0) {
      await prisma.cashier.createMany({
        data: [
          { name: "Naufal" },
          { name: "Sari" },
          { name: "Ade" },
        ],
      });
    }

    const cashiers = await prisma.cashier.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(cashiers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch cashiers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const cashier = await prisma.cashier.create({
      data: { name },
    });
    return NextResponse.json(cashier);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create cashier" }, { status: 500 });
  }
}
