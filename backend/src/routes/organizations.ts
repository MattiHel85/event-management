import { Router } from "express";
import { z } from "zod";
import { toObjectId } from "../lib/objectId.js";
import { EventModel } from "../models/Event.js";
import { OrganizationJoinRequestModel } from "../models/OrganizationJoinRequest.js";
import { OrganizationMemberModel } from "../models/OrganizationMember.js";
import { OrganizationModel } from "../models/Organization.js";
import { UserModel } from "../models/User.js";
import { requireAuth, requirePlatformAdmin } from "../middleware/auth.js";

const router = Router();

const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(80).optional(),
  ownerEmail: z.string().trim().toLowerCase().email().optional(),
  joinCode: z.string().trim().max(64).optional(),
  thisIsMyOrganization: z.boolean().default(false),
});

const joinWithCodeSchema = z.object({
  code: z.string().trim().min(1),
});

router.get("/discover", requireAuth, async (req, res) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userObjectId = toObjectId(req.auth.userId);
  if (!userObjectId) {
    return res.status(401).json({ error: "Invalid session" });
  }

  try {
    const organizations: any[] = await OrganizationModel.find({}).sort({ createdAt: -1 }).lean();
    const orgIds = organizations.map((organization) => organization._id);

    const [memberships, pendingRequests]: [any[], any[]] = await Promise.all([
      OrganizationMemberModel.find({ userId: userObjectId, organizationId: { $in: orgIds } })
        .select("organizationId role")
        .lean() as Promise<any[]>,
      OrganizationJoinRequestModel.find({
        userId: userObjectId,
        organizationId: { $in: orgIds },
        status: "PENDING",
      })
        .select("organizationId")
        .lean() as Promise<any[]>,
    ]);

    const roleByOrgId = new Map(memberships.map((membership) => [String(membership.organizationId), String(membership.role)]));
    const pendingByOrgId = new Set(pendingRequests.map((request) => String(request.organizationId)));

    return res.json(
      organizations.map((organization) => {
        const id = String(organization._id);
        return {
          id,
          name: organization.name,
          slug: organization.slug,
          isMember: roleByOrgId.has(id),
          memberRole: roleByOrgId.get(id) ?? null,
          hasPendingRequest: pendingByOrgId.has(id),
          createdAt: organization.createdAt,
          updatedAt: organization.updatedAt,
        };
      })
    );
  } catch {
    return res.status(500).json({ error: "Failed to load organizations" });
  }
});

router.post("/:orgId/join-requests", requireAuth, async (req, res) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const orgIdParam = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
  const orgObjectId = toObjectId(orgIdParam);
  const userObjectId = toObjectId(req.auth.userId);

  if (!orgObjectId || !userObjectId) {
    return res.status(400).json({ error: "Invalid organization ID" });
  }

  try {
    const [organization, membership]: [any, any] = await Promise.all([
      OrganizationModel.findById(orgObjectId).select("_id").lean(),
      OrganizationMemberModel.findOne({ organizationId: orgObjectId, userId: userObjectId }).select("_id").lean(),
    ]);

    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    if (membership) {
      return res.status(409).json({ error: "You are already a member of this organization" });
    }

    await OrganizationJoinRequestModel.findOneAndUpdate(
      { organizationId: orgObjectId, userId: userObjectId },
      {
        $set: { status: "PENDING" },
      },
      { upsert: true, new: true }
    );

    return res.status(201).json({ success: true, status: "PENDING" });
  } catch {
    return res.status(500).json({ error: "Failed to submit join request" });
  }
});

router.post("/:orgId/join-with-code", requireAuth, async (req, res) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const parsed = joinWithCodeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Join code is required" });
  }

  const orgIdParam = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
  const orgObjectId = toObjectId(orgIdParam);
  const userObjectId = toObjectId(req.auth.userId);

  if (!orgObjectId || !userObjectId) {
    return res.status(400).json({ error: "Invalid organization ID" });
  }

  try {
    const organization: any = await OrganizationModel.findById(orgObjectId).select("_id joinCode").lean();

    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    const expectedCode = String(organization.joinCode ?? "").trim();
    if (!expectedCode) {
      return res.status(400).json({ error: "This organization does not support code-based joining" });
    }

    if (expectedCode !== parsed.data.code) {
      return res.status(403).json({ error: "Invalid join code" });
    }

    const membership: any = await OrganizationMemberModel.findOne({
      organizationId: orgObjectId,
      userId: userObjectId,
    })
      .select("_id")
      .lean();

    if (!membership) {
      await OrganizationMemberModel.create({
        organizationId: orgObjectId,
        userId: userObjectId,
        role: "MEMBER",
      });
    }

    await OrganizationJoinRequestModel.findOneAndDelete({ organizationId: orgObjectId, userId: userObjectId });

    return res.status(201).json({ success: true, role: "MEMBER" });
  } catch {
    return res.status(500).json({ error: "Failed to join organization" });
  }
});

const addMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]).default("MEMBER"),
});

const setJoinCodeSchema = z.object({
  joinCode: z.string().trim().max(64),
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
    const organizations: any[] = await OrganizationModel.find({}).sort({ createdAt: -1 }).lean();

    const orgIds = organizations.map((organization) => organization._id);

    const [memberships, events]: [any[], any[]] = await Promise.all([
      OrganizationMemberModel.find({ organizationId: { $in: orgIds } })
        .select("_id organizationId userId role")
        .lean() as Promise<any[]>,
      EventModel.find({ organizationId: { $in: orgIds } }).select("_id organizationId").lean() as Promise<any[]>,
    ]);

    const userIds = memberships.map((membership) => membership.userId);
    const users: any[] = await UserModel.find({ _id: { $in: userIds } }).select("_id name email").lean();

    const userById = new Map(users.map((user) => [String(user._id), user]));
    const membershipByOrgId = new Map<string, Array<{ id: string; role: string; user: { id: string; name: string | null; email: string } | null }>>();
    const eventCountByOrgId = new Map<string, number>();

    for (const event of events) {
      const key = event.organizationId ? String(event.organizationId) : null;
      if (!key) continue;
      eventCountByOrgId.set(key, (eventCountByOrgId.get(key) ?? 0) + 1);
    }

    for (const membership of memberships) {
      const orgKey = String(membership.organizationId);
      const current = membershipByOrgId.get(orgKey) ?? [];
      const user = userById.get(String(membership.userId));

      current.push({
        id: String(membership._id),
        role: membership.role,
        user: user
          ? {
              id: String(user._id),
              name: user.name ?? null,
              email: user.email,
            }
          : null,
      });

      membershipByOrgId.set(orgKey, current);
    }

    return res.json(
      organizations.map((org) => {
        const orgId = String(org._id);
        const membershipsForOrg = membershipByOrgId.get(orgId) ?? [];

        return {
          id: orgId,
          name: org.name,
          slug: org.slug,
          joinCode: org.joinCode ?? "",
          createdAt: org.createdAt,
          updatedAt: org.updatedAt,
          memberCount: membershipsForOrg.length,
          eventCount: eventCountByOrgId.get(orgId) ?? 0,
          memberships: membershipsForOrg,
        };
      })
    );
  } catch {
    return res.status(500).json({ error: "Failed to load organizations" });
  }
});

router.get("/join-requests", requireAuth, requirePlatformAdmin, async (_req, res) => {
  try {
    const requests: any[] = await OrganizationJoinRequestModel.find({ status: "PENDING" })
      .sort({ createdAt: -1 })
      .select("_id organizationId userId status createdAt")
      .lean();

    const orgIds = requests.map((request) => request.organizationId);
    const userIds = requests.map((request) => request.userId);

    const [organizations, users]: [any[], any[]] = await Promise.all([
      OrganizationModel.find({ _id: { $in: orgIds } }).select("_id name slug").lean() as Promise<any[]>,
      UserModel.find({ _id: { $in: userIds } }).select("_id name email").lean() as Promise<any[]>,
    ]);

    const orgById = new Map(organizations.map((organization) => [String(organization._id), organization]));
    const userById = new Map(users.map((user) => [String(user._id), user]));

    return res.json(
      requests.map((request) => {
        const org = orgById.get(String(request.organizationId));
        const user = userById.get(String(request.userId));
        return {
          id: String(request._id),
          status: request.status,
          createdAt: request.createdAt,
          organization: org
            ? {
                id: String(org._id),
                name: org.name,
                slug: org.slug,
              }
            : null,
          user: user
            ? {
                id: String(user._id),
                name: user.name ?? null,
                email: user.email,
              }
            : null,
        };
      })
    );
  } catch {
    return res.status(500).json({ error: "Failed to load join requests" });
  }
});

router.post("/join-requests/:requestId/approve", requireAuth, requirePlatformAdmin, async (req, res) => {
  const requestIdParam = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;
  const requestObjectId = toObjectId(requestIdParam);

  if (!requestObjectId) {
    return res.status(400).json({ error: "Invalid request ID" });
  }

  try {
    const joinRequest: any = await OrganizationJoinRequestModel.findById(requestObjectId)
      .select("_id organizationId userId status")
      .lean();

    if (!joinRequest) {
      return res.status(404).json({ error: "Join request not found" });
    }

    if (joinRequest.status !== "PENDING") {
      return res.status(409).json({ error: "Join request is no longer pending" });
    }

    await OrganizationMemberModel.findOneAndUpdate(
      { organizationId: joinRequest.organizationId, userId: joinRequest.userId },
      {
        $set: { role: "MEMBER" },
        $setOnInsert: { joinedAt: new Date() },
      },
      { upsert: true, new: true }
    );

    await OrganizationJoinRequestModel.findByIdAndUpdate(requestObjectId, { $set: { status: "APPROVED" } });

    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Failed to approve join request" });
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
      const owner: any = await UserModel.findOne({ email: parsed.data.ownerEmail }).select("_id").lean();

      if (!owner) {
        return res.status(404).json({ error: "Owner user not found for provided email" });
      }

      ownerUserId = String(owner._id);
    }

    const created: any = await OrganizationModel.create({
      name,
      slug,
      joinCode: parsed.data.joinCode?.trim() ?? "",
    });

    if (ownerUserId) {
      const ownerObjectId = toObjectId(ownerUserId);
      if (ownerObjectId) {
        await OrganizationMemberModel.findOneAndUpdate(
          { organizationId: created._id, userId: ownerObjectId },
          {
            $set: { role: "OWNER" },
            $setOnInsert: { joinedAt: new Date() },
          },
          { upsert: true, new: true }
        );
      }
    }

    // Explicit opt-in: creator joins as OWNER only if requested.
    if (parsed.data.thisIsMyOrganization && req.auth?.userId) {
      const creatorObjectId = toObjectId(req.auth.userId);
      const alreadyAssigned = ownerUserId === req.auth.userId;
      if (creatorObjectId && !alreadyAssigned) {
        await OrganizationMemberModel.findOneAndUpdate(
          { organizationId: created._id, userId: creatorObjectId },
          {
            $set: { role: "OWNER" },
            $setOnInsert: { joinedAt: new Date() },
          },
          { upsert: true, new: true }
        );
      }
    }

    return res.status(201).json({
      id: String(created._id),
      name: created.name,
      slug: created.slug,
      joinCode: created.joinCode ?? "",
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? (error as { code?: number }).code : null;
    if (code === 11000) {
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

  const orgIdParam = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
  const orgObjectId = toObjectId(orgIdParam);

  if (!orgObjectId) {
    return res.status(400).json({ error: "Organization ID is required" });
  }

  try {
    const [organization, user]: [any, any] = await Promise.all([
      OrganizationModel.findById(orgObjectId).select("_id").lean() as Promise<any>,
      UserModel.findOne({ email: parsed.data.email }).select("_id email name").lean() as Promise<any>,
    ]);

    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const membership: any = await OrganizationMemberModel.findOneAndUpdate(
      { organizationId: orgObjectId, userId: user._id },
      {
        $set: { role: parsed.data.role },
        $setOnInsert: { joinedAt: new Date() },
      },
      {
        new: true,
        upsert: true,
      }
    ).lean();

    if (!membership) {
      return res.status(500).json({ error: "Failed to assign member" });
    }

    return res.status(201).json({
      membership: {
        id: String(membership._id),
        organizationId: String(membership.organizationId),
        userId: String(membership.userId),
        role: membership.role,
        joinedAt: membership.joinedAt,
      },
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
      },
    });
  } catch {
    return res.status(500).json({ error: "Failed to assign member" });
  }
});

router.post("/:orgId/join-code", requireAuth, requirePlatformAdmin, async (req, res) => {
  const parsed = setJoinCodeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid join code payload" });
  }

  const orgIdParam = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
  const orgObjectId = toObjectId(orgIdParam);

  if (!orgObjectId) {
    return res.status(400).json({ error: "Organization ID is required" });
  }

  try {
    const updated: any = await OrganizationModel.findByIdAndUpdate(
      orgObjectId,
      { $set: { joinCode: parsed.data.joinCode } },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: "Organization not found" });
    }

    return res.json({
      id: String(updated._id),
      name: updated.name,
      slug: updated.slug,
      joinCode: updated.joinCode ?? "",
    });
  } catch {
    return res.status(500).json({ error: "Failed to update join code" });
  }
});

// GET /api/organizations/my - Get organizations where user is admin/owner
router.get("/my", requireAuth, async (req, res) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userObjectId = toObjectId(req.auth.userId);
  if (!userObjectId) {
    return res.status(401).json({ error: "Invalid session" });
  }

  try {
    const memberships: any[] = await OrganizationMemberModel.find({
      userId: userObjectId,
      role: { $in: ["OWNER", "ADMIN"] },
    })
      .select("organizationId role")
      .lean();

    const orgIds = memberships.map((m) => m.organizationId);

    if (orgIds.length === 0) {
      return res.json([]);
    }

    const organizations: any[] = await OrganizationModel.find({ _id: { $in: orgIds } })
      .select("_id name slug")
      .lean();

    const roleByOrgId = new Map(memberships.map((m) => [String(m.organizationId), m.role]));

    return res.json(
      organizations.map((org) => {
        const orgId = String(org._id);
        return {
          id: orgId,
          name: org.name,
          slug: org.slug,
          userRole: roleByOrgId.get(orgId),
        };
      })
    );
  } catch {
    return res.status(500).json({ error: "Failed to load organizations" });
  }
});

// GET /api/organizations/:orgId/members - Get members of an organization (org admin/owner only)
router.get("/:orgId/members", requireAuth, async (req, res) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const orgIdParam = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
  const orgObjectId = toObjectId(orgIdParam);
  const userObjectId = toObjectId(req.auth.userId);

  if (!orgObjectId || !userObjectId) {
    return res.status(400).json({ error: "Invalid IDs" });
  }

  try {
    // Requires org membership with OWNER/ADMIN role.
    const requesterMembership: any = await OrganizationMemberModel.findOne({
      organizationId: orgObjectId,
      userId: userObjectId,
    })
      .select("role")
      .lean();

    if (!requesterMembership || !["OWNER", "ADMIN"].includes(requesterMembership.role)) {
      return res.status(403).json({ error: "You do not have permission to view members of this organization" });
    }

    const memberships: any[] = await OrganizationMemberModel.find({ organizationId: orgObjectId })
      .select("_id userId role joinedAt")
      .lean();

    const userIds = memberships.map((m) => m.userId);
    const users: any[] = await UserModel.find({ _id: { $in: userIds } })
      .select("_id name email")
      .lean();

    const userById = new Map(users.map((u) => [String(u._id), u]));

    const membersList = memberships.map((m) => {
      const user = userById.get(String(m.userId));
      return {
        id: String(m._id),
        userId: String(m.userId),
        role: m.role,
        joinedAt: m.joinedAt,
        user: user
          ? {
              id: String(user._id),
              name: user.name,
              email: user.email,
            }
          : null,
      };
    });

    return res.json({
      members: membersList,
      userRole: requesterMembership.role,
    });
  } catch {
    return res.status(500).json({ error: "Failed to load organization members" });
  }
});

// PATCH /api/organizations/:orgId/members/:memberId - Update member role only
const updateMemberSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
}).strict();

router.patch("/:orgId/members/:memberId", requireAuth, async (req, res) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const parsed = updateMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid update payload" });
  }

  const orgIdParam = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
  const memberIdParam = Array.isArray(req.params.memberId) ? req.params.memberId[0] : req.params.memberId;
  const orgObjectId = toObjectId(orgIdParam);
  const memberObjectId = toObjectId(memberIdParam);
  const userObjectId = toObjectId(req.auth.userId);

  if (!orgObjectId || !memberObjectId || !userObjectId) {
    return res.status(400).json({ error: "Invalid IDs" });
  }

  try {
    // Requires org membership with OWNER/ADMIN role.
    const requesterMembership: any = await OrganizationMemberModel.findOne({
      organizationId: orgObjectId,
      userId: userObjectId,
    })
      .select("role")
      .lean();

    if (!requesterMembership || !["OWNER", "ADMIN"].includes(requesterMembership.role)) {
      return res.status(403).json({ error: "You do not have permission to update members" });
    }

    // Get the member to update
    const membershipToUpdate: any = await OrganizationMemberModel.findById(memberObjectId)
      .select("userId role organizationId")
      .lean();

    if (!membershipToUpdate) {
      return res.status(404).json({ error: "Member not found" });
    }

    if (String(membershipToUpdate.organizationId) !== String(orgObjectId)) {
      return res.status(403).json({ error: "Member does not belong to this organization" });
    }

    // Permission checks for role updates
    if (parsed.data.role !== membershipToUpdate.role) {
      // Admins can't change roles
      if (requesterMembership.role === "ADMIN") {
        return res.status(403).json({ error: "Admins cannot change member roles" });
      }

      // Can't change owners to anything else (owners can only change their own, but that's client-side handled)
      // Actually, owner can change owner to owner, but can't prevent themselves from being owner
      if (membershipToUpdate.role === "OWNER" && requesterMembership.role !== "OWNER") {
        return res.status(403).json({ error: "Only owners can change other owners" });
      }

      // Can't change another admin unless you're owner
      if (membershipToUpdate.role === "ADMIN" && requesterMembership.role !== "OWNER") {
        return res.status(403).json({ error: "Only owners can change admin roles" });
      }
    }

    // Update the membership if role is being changed
    if (parsed.data.role !== membershipToUpdate.role) {
      await OrganizationMemberModel.findByIdAndUpdate(memberObjectId, {
        $set: { role: parsed.data.role },
      });
    }

    // Return updated member
    const updatedMembership: any = await OrganizationMemberModel.findById(memberObjectId)
      .select("_id userId role joinedAt")
      .lean();

    const updatedUser: any = await UserModel.findById(membershipToUpdate.userId)
      .select("_id name email")
      .lean();

    return res.json({
      id: String(updatedMembership._id),
      userId: String(updatedMembership.userId),
      role: updatedMembership.role,
      joinedAt: updatedMembership.joinedAt,
      user: updatedUser
        ? {
            id: String(updatedUser._id),
            name: updatedUser.name,
            email: updatedUser.email,
          }
        : null,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update member" });
  }
});

export default router;
