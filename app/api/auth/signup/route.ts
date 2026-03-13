import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return null;
  }

  const maybeCode = (error as { code?: unknown }).code;
  return typeof maybeCode === "string" ? maybeCode : null;
}

function dbNotReadyResponse() {
  return NextResponse.json(
    {
      error:
        "Database is not configured yet. Set DATABASE_URL and run Prisma migrations before using this endpoint.",
    },
    { status: 503 }
  );
}

export async function POST(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return dbNotReadyResponse();
  }

  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const passwordHash = await hash(password, 10);
    const user = await prisma.user.create({
      data: { name: name || null, email, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2002") {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    if (code === "P1000" || code === "P1001" || code === "P1002") {
      return dbNotReadyResponse();
    }

    return NextResponse.json({ error: "Failed to sign up user" }, { status: 500 });
  }
}
