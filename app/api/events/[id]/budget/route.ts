import { NextRequest } from "next/server";
import { randomUUID } from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params; // consume params (event id available if needed for DB)
  const body = await req.json();

  const { category, description, amount } = body;

  if (!category || !description || typeof amount !== "number" || amount < 0) {
    return Response.json({ error: "Invalid budget item data" }, { status: 400 });
  }

  // TODO: persist with Prisma when Event and BudgetItem tables are implemented.

  const newItem = { id: randomUUID(), category, description, amount };
  return Response.json(newItem, { status: 201 });
}
