import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const router = Router();

const eventSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  date: z.string().trim().min(1),
  location: z.string().trim().min(1),
  capacity: z.number().int().min(1),
  ticketUrl: z
    .string()
    .trim()
    .default("")
    .refine((value) => value === "" || z.string().url().safeParse(value).success, {
      message: "Invalid ticketUrl",
    }),
  budget: z.number().min(0).optional(),
  currency: z.string().trim().min(1).optional(),
});

const budgetItemSchema = z.object({
  category: z.string().trim().min(1),
  description: z.string().trim().min(1),
  amount: z.number().min(0),
});

function toApiEvent(event: {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  capacity: number;
  ticketUrl?: string | null;
  budget: number | null;
  currency: string | null;
  createdAt: Date;
  budgetItems?: Array<{ id: string; category: string; description: string; amount: number }>;
}) {
  return {
    _id: event.id,
    title: event.title,
    description: event.description,
    date: event.date.toISOString().slice(0, 10),
    location: event.location,
    capacity: event.capacity,
    ticketUrl: event.ticketUrl ?? "",
    budget: event.budget ?? undefined,
    currency: event.currency ?? undefined,
    budgetItems: event.budgetItems,
    createdAt: event.createdAt.toISOString(),
  };
}

router.get("/", async (_req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: "asc" },
      include: { budgetItems: true },
    });

    return res.json(events.map(toApiEvent));
  } catch {
    return res.status(500).json({ error: "Failed to load events" });
  }
});

router.post("/", async (req, res) => {
  const parsed = eventSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const payload = parsed.data;
  const eventDate = new Date(payload.date);

  if (Number.isNaN(eventDate.getTime())) {
    return res.status(400).json({ error: "Invalid date" });
  }

  try {
    const created = await prisma.event.create({
      data: {
        title: payload.title,
        description: payload.description,
        date: eventDate,
        location: payload.location,
        capacity: payload.capacity,
        ticketUrl: payload.ticketUrl,
        budget: payload.budget,
        currency: payload.currency ?? "USD",
      },
      include: { budgetItems: true },
    });

    return res.status(201).json(toApiEvent(created));
  } catch {
    return res.status(500).json({ error: "Failed to create event" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: { budgetItems: true },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    return res.json(toApiEvent(event));
  } catch {
    return res.status(500).json({ error: "Failed to load event" });
  }
});

router.put("/:id", async (req, res) => {
  const parsed = eventSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const payload = parsed.data;
  const eventDate = new Date(payload.date);

  if (Number.isNaN(eventDate.getTime())) {
    return res.status(400).json({ error: "Invalid date" });
  }

  try {
    const updated = await prisma.event.update({
      where: { id: req.params.id },
      data: {
        title: payload.title,
        description: payload.description,
        date: eventDate,
        location: payload.location,
        capacity: payload.capacity,
        ticketUrl: payload.ticketUrl,
        budget: payload.budget,
        currency: payload.currency ?? "USD",
      },
      include: { budgetItems: true },
    });

    return res.json(toApiEvent(updated));
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? (error as { code?: string }).code : null;

    if (code === "P2025") {
      return res.status(404).json({ error: "Event not found" });
    }

    return res.status(500).json({ error: "Failed to update event" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.event.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? (error as { code?: string }).code : null;

    if (code === "P2025") {
      return res.status(404).json({ error: "Event not found" });
    }

    return res.status(500).json({ error: "Failed to delete event" });
  }
});

router.post("/:id/budget", async (req, res) => {
  const parsed = budgetItemSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid budget item data" });
  }

  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id }, select: { id: true } });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const created = await prisma.budgetItem.create({
      data: {
        eventId: req.params.id,
        category: parsed.data.category,
        description: parsed.data.description,
        amount: parsed.data.amount,
      },
    });

    return res.status(201).json({
      id: created.id,
      category: created.category,
      description: created.description,
      amount: created.amount,
    });
  } catch {
    return res.status(500).json({ error: "Failed to add budget item" });
  }
});

router.delete("/:id/budget/:itemId", async (req, res) => {
  try {
    await prisma.budgetItem.delete({ where: { id: req.params.itemId } });
    return res.json({ success: true });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? (error as { code?: string }).code : null;

    if (code === "P2025") {
      return res.status(404).json({ error: "Budget item not found" });
    }

    return res.status(500).json({ error: "Failed to remove budget item" });
  }
});

export default router;
