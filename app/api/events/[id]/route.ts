import { NextRequest, NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  await params;
  // TODO: replace with Prisma lookup when Event model/table is implemented.
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  // TODO: replace with Prisma update when Event model/table is implemented.
  return NextResponse.json({ _id: id, ...body });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await params;
  // TODO: replace with Prisma delete when Event model/table is implemented.
  return NextResponse.json({ success: true });
}

