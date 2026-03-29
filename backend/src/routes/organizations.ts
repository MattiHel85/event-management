import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requirePlatformAdmin } from "../middleware/auth.js";

const router = Router();

const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(80).optional(),
  ownerEmail: z.string().trim().toLowerCase().email().optional(),
});

const addMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
});

function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

router.get("/", requireAuth, requirePlatformAdmin, async (_req, res) => {
  try {
    const organizations = await prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        memberships: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        events: {
          select: {
            id: true,
          },
        },
      },
    });

    return res.json(
      organizations.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        memberCount: org.memberships.length,
        eventCount: org.events.length,
        memberships: org.memberships,
      }))
    );
  } catch {
    return res.status(500).json({ error: "Failed to load organizations" });
  }
});

router.post("/", requireAuth, requirePlatformAdmin, async (req, res) => {
  const parsed = createOrganizationSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid organization payload" });
  }

  const name = parsed.data.name.trim();
  const slug = (parsed.data.slug?.trim() || toSlug(name)).toLowerCase();

  if (!slug) {
    return res.status(400).json({ error: "Could not derive a valid slug" });
  }

  try {
    let ownerUserId: string | null = null;

    if (parsed.data.ownerEmail) {
      const owner = await prisma.user.findUnique({
        where: { email: parsed.data.ownerEmail },
        select: { id: true },
      });

      if (!owner) {
        return res.status(404).json({ error: "Owner user not found for provided email" });
      }

      ownerUserId = owner.id;
    }

    const created = await prisma.organization.create({
      data: {
        name,
        slug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (ownerUserId) {
      const existingMembership = await prisma.organizationMember.findFirst({
        where: { organizationId: created.id, userId: ownerUserId },
        select: { id: true },
      });

      if (!existingMembership) {
        await prisma.organizationMember.create({
          data: {
            organizationId: created.id,
            userId: ownerUserId,
            role: "OWNER",
          },
        });
      }
    }

    return res.status(201).json(created);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? (error as { code?: string }).code : null;
    if (code === "P2002") {
      return res.status(409).json({ error: "Organization slug already exists" });
    }
    return res.status(500).json({ error: "Failed to create organization" });
  }
});

router.post("/:orgId/members", requireAuth, requirePlatformAdmin, async (req, res) => {
  const parsed = addMemberSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid member payload" });
  }

  const orgIdParam = req.params.orgId;
  const orgId = Array.isArray(orgIdParam) ? orgIdParam[0] : orgIdParam;

  if (!orgId) {
    return res.status(400).json({ error: "Organization ID is required" });
  }

  try {
    const [organization, user] = await Promise.all([
      prisma.organization.findUnique({ where: { id: orgId }, select: { id: true } }),
      prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true, email: true, name: true } }),
    ]);

    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingMembership = await prisma.organizationMember.findFirst({
      where: { organizationId: orgId, userId: user.id },
      select: { id: true },
    });

    let membership;

    if (existingMembership) {
      membership = await prisma.organizationMember.update({
        where: { id: existingMembership.id },
        data: { role: parsed.data.role },
        select: { id: true, organizationId: true, userId: true, role: true, joinedAt: true },
      });
    } else {
      membership = await prisma.organizationMember.create({
        data: {
          organizationId: orgId,
          userId: user.id,
          role: parsed.data.role,
        },
        select: { id: true, organizationId: true, userId: true, role: true, joinedAt: true },
      });
    }

    return res.status(201).json({
      membership,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch {
    return res.status(500).json({ error: "Failed to assign member" });
  }
});

export default router;
