import type { UserMembership } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  joinCode?: string;
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
  joinCode?: string;
  thisIsMyOrganization?: boolean;
}

interface AssignMemberInput {
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
}

export interface OrganizationDiscoverItem {
  id: string;
  name: string;
  slug: string;
  isMember: boolean;
  memberRole: "OWNER" | "ADMIN" | "MEMBER" | null;
  hasPendingRequest: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationJoinRequestItem {
  id: string;
  status: "PENDING" | "APPROVED" | "DECLINED";
  createdAt: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  } | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
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

export function setOrganizationJoinCode(orgId: string, joinCode: string) {
  return request<{ id: string; name: string; slug: string; joinCode: string }>(
    `/api/admin/organizations/${orgId}/join-code`,
    {
      method: "POST",
      body: JSON.stringify({ joinCode }),
    }
  );
}

export function listDiscoverOrganizations() {
  return request<OrganizationDiscoverItem[]>('/api/organizations/discover');
}

export function requestJoinOrganization(orgId: string) {
  return request<{ success: true; status: "PENDING" }>(`/api/organizations/${orgId}/join-requests`, {
    method: "POST",
  });
}

export function joinOrganizationWithCode(orgId: string, code: string) {
  return request<{ success: true; role: "MEMBER" }>(`/api/organizations/${orgId}/join-with-code`, {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export function listOrganizationJoinRequests() {
  return request<OrganizationJoinRequestItem[]>('/api/admin/organizations/join-requests');
}

export function approveOrganizationJoinRequest(requestId: string) {
  return request<{ success: true }>(`/api/admin/organizations/join-requests/${requestId}/approve`, {
    method: "POST",
  });
}

export interface MyOrganization {
  id: string;
  name: string;
  slug: string;
  userRole: "OWNER" | "ADMIN";
}

export function getMyOrganizations() {
  return request<MyOrganization[]>("/api/organizations/my");
}

export interface OrganizationMember {
  id: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export interface OrganizationMembersResponse {
  members: OrganizationMember[];
  userRole: "OWNER" | "ADMIN";
}

export function getOrganizationMembers(orgId: string) {
  return request<OrganizationMembersResponse>(`/api/organizations/${orgId}/members`);
}

export interface UpdateMemberInput {
  role: "OWNER" | "ADMIN" | "MEMBER";
}

export function updateOrganizationMember(orgId: string, memberId: string, input: UpdateMemberInput) {
  return request<OrganizationMember>(`/api/organizations/${orgId}/members/${memberId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
