const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export type BudgetPeriod = "YEARLY" | "QUARTERLY";

export interface BudgetPlan {
  id?: string;
  period: BudgetPeriod;
  year: number;
  quarter: number;
  amount: number;
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

export function fetchBudgetPlan(params: { period: BudgetPeriod; year: number; quarter?: number }) {
  const query = new URLSearchParams({
    period: params.period,
    year: String(params.year),
    ...(params.period === "QUARTERLY" ? { quarter: String(params.quarter ?? 1) } : {}),
  });

  return request<BudgetPlan>(`/api/budgets/plan?${query.toString()}`);
}

export function updateBudgetPlan(input: { period: BudgetPeriod; year: number; quarter?: number; amount: number }) {
  return request<BudgetPlan>("/api/budgets/plan", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
