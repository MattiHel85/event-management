import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const validPassword = await compare(password, user.passwordHash);

    if (!validPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    return NextResponse.json({
      message: "Sign in successful. Session auth is not implemented yet.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P1000" || code === "P1001" || code === "P1002") {
      return dbNotReadyResponse();
    }

    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 });
  }
}
