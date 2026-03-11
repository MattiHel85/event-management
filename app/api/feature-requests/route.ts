import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, category, priority, details, contact } = body;

  if (!title || !category || !priority || !details) {
    return NextResponse.json(
      { error: "Title, category, priority, and details are required" },
      { status: 400 }
    );
  }

  // TODO: Persist feature requests when database integration is enabled.
  return NextResponse.json(
    {
      id: randomUUID(),
      title,
      category,
      priority,
      details,
      contact: contact ?? "",
      createdAt: new Date().toISOString(),
    },
    { status: 201 }
  );
}
