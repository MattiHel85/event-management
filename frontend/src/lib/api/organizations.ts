import type { UserMembership } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  eventCount: number;
  memberships: Array<
    Pick<UserMembership, "id" | "role"> & {
      user: {
        id: string;
        name: string | null;
        email: string;
      };
    }
  >;
}

interface CreateOrganizationInput {
  name: string;
  slug?: string;
  ownerEmail?: string;
}

interface AssignMemberInput {
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      typeof data === "object" && data && "error" in data
        ? String((data as { error?: unknown }).error)
        : `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

export function listOrganizations() {
  return request<OrganizationSummary[]>("/api/admin/organizations");
}

export function createOrganization(input: CreateOrganizationInput) {
  return request<OrganizationSummary>("/api/admin/organizations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function assignOrganizationMember(orgId: string, input: AssignMemberInput) {
  return request<{ membership: { id: string; role: string }; user: { id: string; email: string; name: string | null } }>(
    `/api/admin/organizations/${orgId}/members`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}
