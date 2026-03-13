import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

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

export async function GET(_req: NextRequest, { params }: Params) {
  if (!process.env.DATABASE_URL) {
    return dbNotReadyResponse();
  }

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P1000" || code === "P1001" || code === "P1002") {
      return dbNotReadyResponse();
    }

    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  if (!process.env.DATABASE_URL) {
    return dbNotReadyResponse();
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined;
    const password = typeof body.password === "string" ? body.password : undefined;

    if (email !== undefined && !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (password !== undefined && password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const data: { name?: string | null; email?: string; passwordHash?: string } = {};

    if (name !== undefined) data.name = name || null;
    if (email !== undefined) data.email = email;
    if (password !== undefined) data.passwordHash = await hash(password, 10);

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No updatable fields provided (name, email, password)" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (code === "P2002") {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    if (code === "P1000" || code === "P1001" || code === "P1002") {
      return dbNotReadyResponse();
    }

    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!process.env.DATABASE_URL) {
    return dbNotReadyResponse();
  }

  const { id } = await params;

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (code === "P1000" || code === "P1001" || code === "P1002") {
      return dbNotReadyResponse();
    }

    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
