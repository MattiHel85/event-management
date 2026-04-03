import { Router } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { z } from "zod";
import { toObjectId } from "../lib/objectId.js";
import { BudgetItemModel } from "../models/BudgetItem.js";
import { EventModel } from "../models/Event.js";
import { EventParticipationModel } from "../models/EventParticipation.js";
import { OrganizationMemberModel } from "../models/OrganizationMember.js";
import { UserModel } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const TOKEN_COOKIE = "session_token";

const eventSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  date: z.string().trim().min(1),
  location: z.string().trim().min(1),
  capacity: z.number().int().min(1),
  organizationId: z.string().trim().min(1).optional(),
  noOrganization: z.boolean().optional(),
  visibility: z.enum(["public", "internal"]).default("public"),
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

const participationSchema = z.object({
  status: z.enum(["INTERESTED", "ATTENDING"]),
});

function toApiEvent(
  event: any,
  canViewBudget: boolean,
  budgetItems?: Array<{ id: string; category: string; description: string; amount: number }>,
  participationStatus?: "INTERESTED" | "ATTENDING" | null,
  attendingCount?: number
) {
  return {
    _id: String(event._id),
    createdById: event.createdById ? String(event.createdById) : undefined,
    title: event.title,
    description: event.description,
    date: event.date.toISOString().slice(0, 10),
    location: event.location,
    capacity: event.capacity,
    organizationId: event.organizationId ? String(event.organizationId) : undefined,
    visibility: (event.visibility ?? "public") as "public" | "internal",
    ticketUrl: event.ticketUrl ?? "",
    budget: canViewBudget ? event.budget ?? undefined : undefined,
    currency: event.currency ?? undefined,
    budgetItems: canViewBudget ? budgetItems : undefined,
    participationStatus: participationStatus ?? null,
    attendingCount: attendingCount ?? 0,
    createdAt: event.createdAt.toISOString(),
  };
}

function getOptionalAuthUserId(req: { cookies?: Record<string, unknown> }) {
  const token = req.cookies?.[TOKEN_COOKIE];
  if (!token || typeof token !== "string") return null;

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return null;

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    if (!decoded?.userId || typeof decoded.userId !== "string") return null;
    return decoded.userId;
  } catch {
    return null;
  }
}

async function canViewEventBudget(userId: string | null, event: { organizationId: unknown; createdById: unknown }) {
  if (!userId) return false;
  if (event.createdById && String(event.createdById) === userId) return true;
  if (!event.organizationId) return false;

  const userObjectId = toObjectId(userId);
  const organizationObjectId = toObjectId(String(event.organizationId));

  if (!userObjectId || !organizationObjectId) return false;

  const membership: any = await OrganizationMemberModel.findOne({
    organizationId: organizationObjectId,
    userId: userObjectId,
  })
    .select("_id")
    .lean();

  return Boolean(membership);
}

async function getDefaultOrganizationIdForUser(userId: string | null) {
  if (!userId) return null;

  const userObjectId = toObjectId(userId);
  if (!userObjectId) return null;

  const membership: any = await OrganizationMemberModel.findOne({ userId: userObjectId })
    .sort({ joinedAt: 1, _id: 1 })
    .select("organizationId")
    .lean();

  return membership?.organizationId ?? null;
}

async function canManageEvent(userId: string | null, event: { createdById: unknown; organizationId: unknown }) {
  if (!userId) return false;
  if (event.createdById && String(event.createdById) === userId) return true;

  const userObjectId = toObjectId(userId);
  if (!userObjectId) return false;

  if (!event.organizationId) return false;
  const organizationObjectId = toObjectId(String(event.organizationId));
  if (!organizationObjectId) return false;

  const membership: any = await OrganizationMemberModel.findOne({
    organizationId: organizationObjectId,
    userId: userObjectId,
    role: { $in: ["OWNER", "ADMIN"] },
  })
    .select("_id")
    .lean();

  return Boolean(membership);
}

router.get("/", async (_req, res) => {
  try {
    const userId = getOptionalAuthUserId(_req);
    const userObjectId = userId ? toObjectId(userId) : null;

    const [events, memberships, user]: [any[], any[], any] = await Promise.all([
      EventModel.find({}).sort({ date: 1 }).lean() as Promise<any[]>,
      userObjectId
        ? (OrganizationMemberModel.find({ userId: userObjectId }).select("organizationId").lean() as Promise<any[]>)
        : Promise.resolve([]),
      userObjectId ? UserModel.findById(userObjectId).select("role").lean() : Promise.resolve(null),
    ]);

    const isPlatformAdmin = user?.role === "PLATFORM_ADMIN";

    const allowedOrgIds = new Set(memberships.map((membership) => String(membership.organizationId)));

    const visibleEvents = isPlatformAdmin
      ? events
      : events.filter((event) => {
      if ((event.visibility ?? "public") !== "internal") return true;
      if (!userId) return false;
      if (String(event.createdById ?? "") === userId) return true;
      const orgId = event.organizationId ? String(event.organizationId) : null;
      return orgId ? allowedOrgIds.has(orgId) : false;
        });

    const budgetItems: any[] = await BudgetItemModel.find({
      eventId: { $in: visibleEvents.map((event) => event._id) },
    })
      .select("_id eventId category description amount")
      .lean();

    const participations: any[] =
      userObjectId && visibleEvents.length > 0
        ? await EventParticipationModel.find({
            userId: userObjectId,
            eventId: { $in: visibleEvents.map((event) => event._id) },
          })
            .select("eventId status")
            .lean()
        : [];

    const attendingParticipations: any[] =
      visibleEvents.length > 0
        ? await EventParticipationModel.find({
            eventId: { $in: visibleEvents.map((event) => event._id) },
            status: "ATTENDING",
          })
            .select("eventId")
            .lean()
        : [];

    const participationByEventId = new Map<string, "INTERESTED" | "ATTENDING">(
      participations.map((entry) => [String(entry.eventId), entry.status as "INTERESTED" | "ATTENDING"])
    );
    const attendingCountByEventId = new Map<string, number>();
    for (const entry of attendingParticipations) {
      const key = String(entry.eventId);
      attendingCountByEventId.set(key, (attendingCountByEventId.get(key) ?? 0) + 1);
    }

    const budgetItemsByEventId = new Map<string, Array<{ id: string; category: string; description: string; amount: number }>>();

    for (const item of budgetItems) {
      const key = String(item.eventId);
      const current = budgetItemsByEventId.get(key) ?? [];
      current.push({
        id: String(item._id),
        category: item.category,
        description: item.description,
        amount: item.amount,
      });
      budgetItemsByEventId.set(key, current);
    }

    return res.json(
      visibleEvents.map((event) => {
        const orgId = event.organizationId ? String(event.organizationId) : null;
        const canViewBudget =
          isPlatformAdmin ||
          (Boolean(userId) && (String(event.createdById ?? "") === userId || (orgId ? allowedOrgIds.has(orgId) : false)));

        return toApiEvent(
          event,
          canViewBudget,
          budgetItemsByEventId.get(String(event._id)) ?? [],
          participationByEventId.get(String(event._id)) ?? null,
          attendingCountByEventId.get(String(event._id)) ?? 0
        );
      })
    );
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

  const organizationObjectId = payload.organizationId ? toObjectId(payload.organizationId) : null;
  if (payload.organizationId && !organizationObjectId) {
    return res.status(400).json({ error: "Invalid organizationId" });
  }

  try {
    const userId = getOptionalAuthUserId(req);
    const createdByObjectId = userId ? toObjectId(userId) : null;
    const defaultOrganizationId = await getDefaultOrganizationIdForUser(userId);
    const effectiveOrganizationId = payload.noOrganization ? null : organizationObjectId ?? defaultOrganizationId;

    const created: any = await EventModel.create({
      createdById: createdByObjectId,
      title: payload.title,
      description: payload.description,
      date: eventDate,
      location: payload.location,
      capacity: payload.capacity,
      organizationId: effectiveOrganizationId,
      visibility: payload.visibility ?? "public",
      ticketUrl: payload.ticketUrl,
      budget: payload.budget,
      currency: payload.currency ?? "USD",
    });

    return res.status(201).json(toApiEvent(created.toObject(), true, []));
  } catch {
    return res.status(500).json({ error: "Failed to create event" });
  }
});

router.get("/:id", async (req, res) => {
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const eventId = toObjectId(idParam);
  if (!eventId) {
    return res.status(404).json({ error: "Event not found" });
  }

  try {
    const userId = getOptionalAuthUserId(req);

    const [event, budgetItems]: [any, any[]] = await Promise.all([
      EventModel.findById(eventId).lean() as Promise<any>,
      BudgetItemModel.find({ eventId }).select("_id category description amount").lean() as Promise<any[]>,
    ]);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const canViewBudget = await canViewEventBudget(userId, {
      organizationId: event.organizationId,
      createdById: event.createdById,
    });

    let participationStatus: "INTERESTED" | "ATTENDING" | null = null;
    if (userId) {
      const userObjectId = toObjectId(userId);
      if (userObjectId) {
        const participation: any = await EventParticipationModel.findOne({ eventId, userId: userObjectId })
          .select("status")
          .lean();
        participationStatus = (participation?.status as "INTERESTED" | "ATTENDING" | undefined) ?? null;
      }
    }

    const attendingCount = await EventParticipationModel.countDocuments({
      eventId,
      status: "ATTENDING",
    });

    return res.json(
      toApiEvent(
        event,
        canViewBudget,
        budgetItems.map((item) => ({
          id: String(item._id),
          category: item.category,
          description: item.description,
          amount: item.amount,
        })),
        participationStatus,
        attendingCount
      )
    );
  } catch {
    return res.status(500).json({ error: "Failed to load event" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const eventId = toObjectId(idParam);
  if (!eventId) {
    return res.status(404).json({ error: "Event not found" });
  }

  const parsed = eventSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const payload = parsed.data;
  const eventDate = new Date(payload.date);

  if (Number.isNaN(eventDate.getTime())) {
    return res.status(400).json({ error: "Invalid date" });
  }

  const organizationObjectId = payload.organizationId ? toObjectId(payload.organizationId) : null;
  if (payload.organizationId && !organizationObjectId) {
    return res.status(400).json({ error: "Invalid organizationId" });
  }

  try {
    const existing: any = await EventModel.findById(eventId)
      .select("_id createdById organizationId")
      .lean();

    if (!existing) {
      return res.status(404).json({ error: "Event not found" });
    }

    const allowed = await canManageEvent(req.auth?.userId ?? null, {
      createdById: existing.createdById,
      organizationId: existing.organizationId,
    });

    if (!allowed) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updated: any = await EventModel.findByIdAndUpdate(
      eventId,
      {
        title: payload.title,
        description: payload.description,
        date: eventDate,
        location: payload.location,
        capacity: payload.capacity,
        organizationId: organizationObjectId,
        visibility: payload.visibility ?? "public",
        ticketUrl: payload.ticketUrl,
        budget: payload.budget,
        currency: payload.currency ?? "USD",
      },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: "Event not found" });
    }

    const budgetItems: any[] = await BudgetItemModel.find({ eventId }).select("_id category description amount").lean();

    return res.json(
      toApiEvent(
        updated,
        true,
        budgetItems.map((item) => ({
          id: String(item._id),
          category: item.category,
          description: item.description,
          amount: item.amount,
        }))
      )
    );
  } catch {
    return res.status(500).json({ error: "Failed to update event" });
  }
});

router.delete("/:id", async (req, res) => {
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const eventId = toObjectId(idParam);
  if (!eventId) {
    return res.status(404).json({ error: "Event not found" });
  }

  try {
    const deleted = await EventModel.findByIdAndDelete(eventId).lean();

    if (!deleted) {
      return res.status(404).json({ error: "Event not found" });
    }

    await BudgetItemModel.deleteMany({ eventId });
    await EventParticipationModel.deleteMany({ eventId });

    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Failed to delete event" });
  }
});

router.post("/:id/budget", requireAuth, async (req, res) => {
  const parsed = budgetItemSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid budget item data" });
  }

  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const eventId = toObjectId(idParam);
  if (!eventId) {
    return res.status(400).json({ error: "Event ID is required" });
  }

  try {
    const event: any = await EventModel.findById(eventId)
      .select("_id organizationId createdById")
      .lean();

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const canViewBudget = await canViewEventBudget(req.auth?.userId ?? null, {
      organizationId: event.organizationId,
      createdById: event.createdById,
    });

    if (!canViewBudget) {
      return res.status(403).json({ error: "Not authorized to manage this budget" });
    }

    const created: any = await BudgetItemModel.create({
      eventId,
      category: parsed.data.category,
      description: parsed.data.description,
      amount: parsed.data.amount,
    });

    return res.status(201).json({
      id: String(created._id),
      category: created.category,
      description: created.description,
      amount: created.amount,
    });
  } catch {
    return res.status(500).json({ error: "Failed to add budget item" });
  }
});

router.delete("/:id/budget/:itemId", requireAuth, async (req, res) => {
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const itemIdParam = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
  const eventId = toObjectId(idParam);
  const itemId = toObjectId(itemIdParam);

  if (!eventId || !itemId) {
    return res.status(400).json({ error: "Event ID and item ID are required" });
  }

  try {
    const event: any = await EventModel.findById(eventId)
      .select("organizationId createdById")
      .lean();

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const canViewBudget = await canViewEventBudget(req.auth?.userId ?? null, {
      organizationId: event.organizationId,
      createdById: event.createdById,
    });

    if (!canViewBudget) {
      return res.status(403).json({ error: "Not authorized to manage this budget" });
    }

    const deleted = await BudgetItemModel.deleteOne({ _id: itemId, eventId });

    if (deleted.deletedCount === 0) {
      return res.status(404).json({ error: "Budget item not found" });
    }

    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Failed to remove budget item" });
  }
});

router.post("/:id/participation", requireAuth, async (req, res) => {
  const parsed = participationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid participation payload" });
  }

  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const eventId = toObjectId(idParam);
  const userId = toObjectId(req.auth?.userId ?? "");

  if (!eventId || !userId) {
    return res.status(400).json({ error: "Invalid event or user" });
  }

  try {
    const event: any = await EventModel.findById(eventId)
      .select("_id visibility organizationId createdById capacity")
      .lean();

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if ((event.visibility ?? "public") === "internal") {
      const allowed = await canViewEventBudget(req.auth?.userId ?? null, {
        organizationId: event.organizationId,
        createdById: event.createdById,
      });
      if (!allowed) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    const existingParticipation: any = await EventParticipationModel.findOne({ eventId, userId })
      .select("status")
      .lean();

    const isBecomingAttending = parsed.data.status === "ATTENDING" && existingParticipation?.status !== "ATTENDING";

    if (isBecomingAttending) {
      const attendingCount = await EventParticipationModel.countDocuments({ eventId, status: "ATTENDING" });
      const capacity = Number(event.capacity ?? 0);
      if (capacity > 0 && attendingCount >= capacity) {
        return res.status(409).json({ error: "Event is at full capacity" });
      }
    }

    const saved: any = await EventParticipationModel.findOneAndUpdate(
      { eventId, userId },
      { $set: { status: parsed.data.status } },
      { upsert: true, new: true }
    )
      .select("status")
      .lean();

    const attendingCount = await EventParticipationModel.countDocuments({ eventId, status: "ATTENDING" });

    return res.json({
      status: saved.status as "INTERESTED" | "ATTENDING",
      attendingCount,
    });
  } catch {
    return res.status(500).json({ error: "Failed to update participation" });
  }
});

router.delete("/:id/participation", requireAuth, async (req, res) => {
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const eventId = toObjectId(idParam);
  const userId = toObjectId(req.auth?.userId ?? "");

  if (!eventId || !userId) {
    return res.status(400).json({ error: "Invalid event or user" });
  }

  try {
    await EventParticipationModel.deleteOne({ eventId, userId });
    const attendingCount = await EventParticipationModel.countDocuments({ eventId, status: "ATTENDING" });
    return res.json({ success: true, attendingCount });
  } catch {
    return res.status(500).json({ error: "Failed to clear participation" });
  }
});

router.get("/:id/attendees", requireAuth, async (req, res) => {
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const eventId = toObjectId(idParam);
  if (!eventId) {
    return res.status(404).json({ error: "Event not found" });
  }

  try {
    const event: any = await EventModel.findById(eventId)
      .select("createdById organizationId")
      .lean();

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const userId = req.auth?.userId ?? null;
    const isCreator = event.createdById && String(event.createdById) === userId;

    let hasOrgAdminRights = false;
    if (event.organizationId && userId) {
      const userObjectId = toObjectId(userId);
      if (userObjectId) {
        const member: any = await OrganizationMemberModel.findOne({
          organizationId: event.organizationId,
          userId: userObjectId,
          role: { $in: ["OWNER", "ADMIN"] },
        })
          .select("_id")
          .lean();
        hasOrgAdminRights = Boolean(member);
      }
    }

    if (!isCreator && !hasOrgAdminRights) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const participations: any[] = await EventParticipationModel.find({ eventId })
      .select("userId status")
      .lean();

    const userIds = participations.map((p) => p.userId);
    const users: any[] = await UserModel.find({ _id: { $in: userIds } })
      .select("name email")
      .lean();

    const userById = new Map(users.map((u) => [String(u._id), u]));

    const attendees = participations.map((p) => {
      const u = userById.get(String(p.userId));
      return {
        userId: String(p.userId),
        name: u?.name ?? null,
        email: u?.email ?? "",
        status: p.status as "INTERESTED" | "ATTENDING",
      };
    });

    return res.json({ attendees });
  } catch {
    return res.status(500).json({ error: "Failed to fetch attendees" });
  }
});


export default router;
