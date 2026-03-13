import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  // TODO: replace with Prisma query when Event model/table is implemented.
  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  // TODO: replace with Prisma create when Event model/table is implemented.
  const body = await req.json();
  return NextResponse.json({ _id: "mock-id", ...body }, { status: 201 });
}
