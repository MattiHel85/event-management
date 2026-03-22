import { randomUUID } from "crypto";
import { Router } from "express";
import { z } from "zod";

const router = Router();

const featureRequestSchema = z.object({
  title: z.string().trim().min(1),
  category: z.string().trim().min(1),
  priority: z.string().trim().min(1),
  details: z.string().trim().min(1),
  contact: z.string().trim().optional(),
});

router.post("/", (req, res) => {
  const parsed = featureRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Title, category, priority, and details are required",
    });
  }

  const { title, category, priority, details, contact } = parsed.data;

  return res.status(201).json({
    id: randomUUID(),
    title,
    category,
    priority,
    details,
    contact: contact ?? "",
    createdAt: new Date().toISOString(),
  });
});

export default router;
