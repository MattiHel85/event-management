import { Router } from "express";
import { z } from "zod";
import { toObjectId } from "../lib/objectId.js";
import { BudgetPlanModel } from "../models/BudgetPlan.js";
import { EventModel } from "../models/Event.js";
import { OrganizationMemberModel } from "../models/OrganizationMember.js";
import { OrganizationModel } from "../models/Organization.js";
import { UserModel } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const ORG_BUDGET_ROLES = new Set(["OWNER", "ADMIN"]);

const planScopeSchema = z.enum(["PERSONAL", "ORG"]);

const updatePlanSchema = z.object({
  scopeType: planScopeSchema,
  organizationId: z.string().trim().min(1).optional(),
  year: z.number().int().min(2000).max(3000),
  currency: z.string().trim().toUpperCase().min(3).max(8),
  amount: z.number().min(0),
  categories: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        amount: z.number().min(0),
      })
    )
    .optional(),
});

async function canAccessBudgets(userId: string) {
  const userObjectId = toObjectId(userId);
  if (!userObjectId) return false;

  const [user, createdEvent, privilegedMembership]: [any, any, any] = await Promise.all([
    UserModel.findById(userObjectId).select("role").lean(),
    EventModel.findOne({ createdById: userObjectId }).select("_id").lean(),
    OrganizationMemberModel.findOne({
      userId: userObjectId,
      role: { $in: Array.from(ORG_BUDGET_ROLES) },
    })
      .select("_id")
      .lean(),
  ]);

  if (user?.role === "PLATFORM_ADMIN") return true;
  if (createdEvent) return true;
  if (privilegedMembership) return true;
  return false;
}

async function getBudgetAccessContext(userId: string) {
  const userObjectId = toObjectId(userId);
  if (!userObjectId) return null;

  const [user, memberships]: [any, any[]] = await Promise.all([
    UserModel.findById(userObjectId).select("role").lean(),
    OrganizationMemberModel.find({
      userId: userObjectId,
      role: { $in: Array.from(ORG_BUDGET_ROLES) },
    })
      .select("organizationId role")
      .lean(),
  ]);

  return {
    userObjectId,
    isPlatformAdmin: user?.role === "PLATFORM_ADMIN",
    orgIds: memberships.map((membership) => membership.organizationId),
  };
}

function buildLegacyPeriodKey(input: {
  scopeType: "PERSONAL" | "ORG";
  userId: string;
  currency: string;
  organizationId?: string;
}) {
  if (input.scopeType === "ORG") {
    return `ORG:${input.organizationId ?? ""}:${input.currency}`;
  }
  return `PERSONAL:${input.userId}:${input.currency}`;
}

router.get("/plans", requireAuth, async (req, res) => {
  if (!req.auth?.userId || !(await canAccessBudgets(req.auth.userId))) {
    return res.status(403).json({ error: "Insufficient permissions for budgets" });
  }

  const year = Number(req.query.year) || new Date().getFullYear();

  try {
    const access = await getBudgetAccessContext(req.auth.userId);
    if (!access) {
      return res.status(403).json({ error: "Insufficient permissions for budgets" });
    }

    const query = access.isPlatformAdmin
      ? { year }
      : {
          year,
          $or: [
            { scopeType: "PERSONAL", ownerUserId: access.userObjectId },
            { scopeType: "ORG", organizationId: { $in: access.orgIds } },
          ],
        };

    const plans: any[] = await BudgetPlanModel.find(query)
      .select("_id scopeType ownerUserId organizationId year currency amount categories createdAt updatedAt")
      .sort({ scopeType: 1, currency: 1 })
      .lean();

    const orgIds = plans
      .filter((plan) => plan.organizationId)
      .map((plan) => plan.organizationId);

    const organizations: any[] = orgIds.length
      ? await OrganizationModel.find({ _id: { $in: orgIds } }).select("_id name").lean()
      : [];
    const orgById = new Map(organizations.map((org) => [String(org._id), org]));

    return res.json({
      plans: plans.map((plan) => ({
        id: String(plan._id),
        scopeType: plan.scopeType,
        organizationId: plan.organizationId ? String(plan.organizationId) : undefined,
        organizationName: plan.organizationId ? orgById.get(String(plan.organizationId))?.name ?? null : null,
        year: plan.year,
        currency: plan.currency,
        amount: plan.amount,
        categories: Array.isArray(plan.categories)
          ? plan.categories.map((item: any) => ({
              name: item.name,
              amount: item.amount,
            }))
          : [],
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      })),
    });
  } catch {
    return res.status(500).json({ error: "Failed to load budget plans" });
  }
});

router.put("/plans", requireAuth, async (req, res) => {
  if (!req.auth?.userId || !(await canAccessBudgets(req.auth.userId))) {
    return res.status(403).json({ error: "Insufficient permissions for budgets" });
  }

  const parsed = updatePlanSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid budget plan payload" });
  }

  const payload = parsed.data;

  try {
    const access = await getBudgetAccessContext(req.auth.userId);
    if (!access) {
      return res.status(403).json({ error: "Insufficient permissions for budgets" });
    }

    const currency = payload.currency.trim().toUpperCase();
    let query: Record<string, unknown>;

    if (payload.scopeType === "PERSONAL") {
      const existingPersonal: any = await BudgetPlanModel.findOne({
        scopeType: "PERSONAL",
        ownerUserId: access.userObjectId,
        year: payload.year,
      })
        .select("_id currency")
        .lean();

      if (existingPersonal && existingPersonal.currency !== currency) {
        return res.status(409).json({
          error: `Personal budget for ${payload.year} already exists in ${existingPersonal.currency}. Only one personal currency is allowed.`,
        });
      }

      query = {
        scopeType: "PERSONAL",
        ownerUserId: access.userObjectId,
        year: payload.year,
      };
    } else {
      const organizationObjectId = payload.organizationId ? toObjectId(payload.organizationId) : null;
      if (!organizationObjectId) {
        return res.status(400).json({ error: "organizationId is required for ORG plans" });
      }

      const canManageOrgPlan =
        access.isPlatformAdmin || access.orgIds.some((orgId) => String(orgId) === String(organizationObjectId));

      if (!canManageOrgPlan) {
        return res.status(403).json({ error: "Not allowed to manage this organization budget" });
      }

      query = {
        scopeType: "ORG",
        organizationId: organizationObjectId,
        year: payload.year,
        currency,
      };
    }

    const updated: any = await BudgetPlanModel.findOneAndUpdate(
      query,
      {
        $set: {
          scopeType: payload.scopeType,
          period: buildLegacyPeriodKey({
            scopeType: payload.scopeType,
            userId: req.auth.userId,
            currency,
            organizationId: payload.organizationId,
          }),
          quarter: 0,
          year: payload.year,
          currency,
          amount: payload.amount,
          categories: (payload.categories ?? []).map((item) => ({
            name: item.name.trim(),
            amount: item.amount,
          })),
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    )
      .select("_id scopeType ownerUserId organizationId period year quarter currency amount categories createdAt updatedAt")
      .lean();

    if (!updated) {
      return res.status(500).json({ error: "Failed to save budget plan" });
    }

    const organization: any =
      updated.organizationId ? await OrganizationModel.findById(updated.organizationId).select("name").lean() : null;

    return res.json({
      id: String(updated._id),
      scopeType: updated.scopeType,
      organizationId: updated.organizationId ? String(updated.organizationId) : undefined,
      organizationName: organization?.name ?? null,
      year: updated.year,
      currency: updated.currency,
      amount: updated.amount,
      categories: Array.isArray(updated.categories)
        ? updated.categories.map((item: any) => ({
            name: item.name,
            amount: item.amount,
          }))
        : [],
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch {
    return res.status(500).json({ error: "Failed to save budget plan" });
  }
});

router.delete("/plans/:id", requireAuth, async (req, res) => {
  if (!req.auth?.userId || !(await canAccessBudgets(req.auth.userId))) {
    return res.status(403).json({ error: "Insufficient permissions for budgets" });
  }

  const { id } = req.params;
  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid plan ID" });
  }
  const planId = toObjectId(id);
  if (!planId) {
    return res.status(400).json({ error: "Invalid plan ID" });
  }

  try {
    const access = await getBudgetAccessContext(req.auth.userId);
    if (!access) {
      return res.status(403).json({ error: "Insufficient permissions for budgets" });
    }

    const plan: any = await BudgetPlanModel.findById(planId).select("scopeType ownerUserId organizationId").lean();
    if (!plan) {
      return res.status(404).json({ error: "Budget plan not found" });
    }

    if (plan.scopeType === "PERSONAL") {
      if (!access.isPlatformAdmin && String(plan.ownerUserId) !== String(access.userObjectId)) {
        return res.status(403).json({ error: "Not allowed to delete this budget plan" });
      }
    } else {
      const canManage =
        access.isPlatformAdmin || access.orgIds.some((orgId) => String(orgId) === String(plan.organizationId));
      if (!canManage) {
        return res.status(403).json({ error: "Not allowed to delete this budget plan" });
      }
    }

    await BudgetPlanModel.findByIdAndDelete(planId);
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Failed to delete budget plan" });
  }
});

export default router;
