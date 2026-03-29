const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface SignUpInput {
  name: string;
  email: string;
  password: string;
}

interface SignInInput {
  email: string;
  password: string;
}

export interface UserMembership {
  id: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  organizationId: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "PLATFORM_ADMIN";
  createdAt: string;
  updatedAt: string;
  memberships: UserMembership[];
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

export function signUp(input: SignUpInput) {
  return request<User>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function signIn(input: SignInInput) {
  return request<{ message: string; user: User }>("/api/auth/signin", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function me() {
  return request<{ user: User }>("/api/auth/me");
}

export function logout() {
  return request<{ message: string }>("/api/auth/logout", {
    method: "POST",
  });
}
