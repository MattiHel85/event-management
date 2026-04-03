const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export type BudgetPeriod = "YEARLY" | "QUARTERLY";
export type BudgetScopeType = "PERSONAL" | "ORG";

export interface BudgetPlan {
  id?: string;
  scopeType: BudgetScopeType;
  organizationId?: string;
  organizationName?: string | null;
  year: number;
  currency: string;
  amount: number;
  categories?: Array<{
    name: string;
    amount: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
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

export function fetchBudgetPlans(params: { year: number }) {
  const query = new URLSearchParams({
    year: String(params.year),
  });

  return request<{ plans: BudgetPlan[] }>(`/api/budgets/plans?${query.toString()}`);
}

export function updateBudgetPlan(input: {
  scopeType: BudgetScopeType;
  organizationId?: string;
  year: number;
  currency: string;
  amount: number;
  categories?: Array<{
    name: string;
    amount: number;
  }>;
}) {
  return request<BudgetPlan>("/api/budgets/plans", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteBudgetPlan(id: string) {
  return request<{ success: boolean }>(`/api/budgets/plans/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
