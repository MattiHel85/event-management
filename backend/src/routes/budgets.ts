import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const periodSchema = z.enum(["YEARLY", "QUARTERLY"]);

const updatePlanSchema = z
  .object({
    period: periodSchema,
    year: z.number().int().min(2000).max(3000),
    quarter: z.number().int().min(1).max(4).optional(),
    amount: z.number().min(0),
  })
  .superRefine((value, ctx) => {
    if (value.period === "QUARTERLY" && !value.quarter) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quarter"],
        message: "Quarter is required for QUARTERLY period",
      });
    }
  });

router.get("/plan", requireAuth, async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const period = req.query.period === "QUARTERLY" ? "QUARTERLY" : "YEARLY";
  const quarter = period === "QUARTERLY" ? Number(req.query.quarter) || 1 : 0;

  try {
    const plan = await prisma.budgetPlan.findUnique({
      where: {
        period_year_quarter: {
          period,
          year,
          quarter,
        },
      },
      select: {
        id: true,
        period: true,
        year: true,
        quarter: true,
        amount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!plan) {
      return res.json({
        period,
        year,
        quarter,
        amount: 0,
      });
    }

    return res.json(plan);
  } catch {
    return res.status(500).json({ error: "Failed to load budget plan" });
  }
});

router.put("/plan", requireAuth, async (req, res) => {
  const parsed = updatePlanSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid budget plan payload" });
  }

  const payload = parsed.data;
  const quarter = payload.period === "QUARTERLY" ? payload.quarter ?? 1 : 0;

  try {
    const updated = await prisma.budgetPlan.upsert({
      where: {
        period_year_quarter: {
          period: payload.period,
          year: payload.year,
          quarter,
        },
      },
      update: {
        amount: payload.amount,
      },
      create: {
        period: payload.period,
        year: payload.year,
        quarter,
        amount: payload.amount,
      },
      select: {
        id: true,
        period: true,
        year: true,
        quarter: true,
        amount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json(updated);
  } catch {
    return res.status(500).json({ error: "Failed to save budget plan" });
  }
});

export default router;
