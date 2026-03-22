import type { IEvent, IBudgetItem } from "../models/Event";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface EventInput {
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  budget?: number;
  currency?: string;
}

interface BudgetItemInput {
  category: string;
  description: string;
  amount: number;
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

export function fetchEvents() {
  return request<IEvent[]>("/api/events");
}

export function fetchEventById(id: string) {
  return request<IEvent>(`/api/events/${id}`);
}

export function createEvent(input: EventInput) {
  return request<IEvent>("/api/events", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateEvent(id: string, input: EventInput) {
  return request<IEvent>(`/api/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteEvent(id: string) {
  await request<{ success: boolean }>(`/api/events/${id}`, {
    method: "DELETE",
  });
}

export function addBudgetItem(eventId: string, input: BudgetItemInput) {
  return request<IBudgetItem>(`/api/events/${eventId}/budget`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteBudgetItem(eventId: string, itemId: string) {
  await request<{ success: boolean }>(`/api/events/${eventId}/budget/${itemId}`, {
    method: "DELETE",
  });
}
