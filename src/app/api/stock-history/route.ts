import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const history = await prisma.stockHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stock history" }, { status: 500 });
  }
}
