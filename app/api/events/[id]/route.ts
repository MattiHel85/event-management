import { NextRequest, NextResponse } from "next/server";
// import { connectDB } from "@/lib/mongodb";
// import Event from "@/lib/models/Event";
// import mongoose from "mongoose";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  // TODO: restore when MongoDB is connected
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  // TODO: restore when MongoDB is connected
  return NextResponse.json({ _id: id, ...body });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await params;
  // TODO: restore when MongoDB is connected
  return NextResponse.json({ success: true });
}

