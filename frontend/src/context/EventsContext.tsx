import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { IEvent } from "../lib/models/Event";
import {
  addBudgetItem as addBudgetItemApi,
  createEvent as createEventApi,
  deleteBudgetItem as deleteBudgetItemApi,
  deleteEvent as deleteEventApi,
  fetchEvents,
  updateEvent as updateEventApi,
} from "../lib/api/events";

interface EventInput {
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  ticketUrl: string;
  budget?: number;
  currency?: string;
}

interface BudgetItemInput {
  category: string;
  description: string;
  amount: number;
}

interface EventsContextValue {
  events: IEvent[];
  loading: boolean;
  error: string;
  refreshEvents: () => Promise<void>;
  findEventById: (id: string) => IEvent | undefined;
  createEvent: (input: EventInput) => Promise<IEvent>;
  updateEvent: (id: string, input: EventInput) => Promise<IEvent>;
  deleteEvent: (id: string) => Promise<void>;
  addBudgetItem: (eventId: string, item: BudgetItemInput) => Promise<{ id: string; category: string; description: string; amount: number }>;
  deleteBudgetItem: (eventId: string, itemId: string) => Promise<void>;
}

const EventsContext = createContext<EventsContextValue | null>(null);

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshEvents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshEvents();
  }, []);

  const value = useMemo<EventsContextValue>(() => {
    const findEventById = (id: string) => events.find((e) => e._id === id);

    const createEvent = async (input: EventInput) => {
      const created = await createEventApi(input);
      setEvents((prev) => [created, ...prev]);
      return created;
    };

    const updateEvent = async (id: string, input: EventInput) => {
      const updated = await updateEventApi(id, input);
      setEvents((prev) => prev.map((event) => (event._id === id ? updated : event)));
      return updated;
    };

    const deleteEvent = async (id: string) => {
      await deleteEventApi(id);
      setEvents((prev) => prev.filter((event) => event._id !== id));
    };

    const addBudgetItem = async (eventId: string, item: BudgetItemInput) => {
      const created = await addBudgetItemApi(eventId, item);

      setEvents((prev) =>
        prev.map((event) => {
          if (event._id !== eventId) return event;
          return {
            ...event,
            budgetItems: [...(event.budgetItems ?? []), created],
          };
        })
      );

      return created;
    };

    const deleteBudgetItem = async (eventId: string, itemId: string) => {
      await deleteBudgetItemApi(eventId, itemId);

      setEvents((prev) =>
        prev.map((event) => {
          if (event._id !== eventId) return event;
          return {
            ...event,
            budgetItems: (event.budgetItems ?? []).filter((item) => item.id !== itemId),
          };
        })
      );
    };

    return {
      events,
      loading,
      error,
      refreshEvents,
      findEventById,
      createEvent,
      updateEvent,
      deleteEvent,
      addBudgetItem,
      deleteBudgetItem,
    };
  }, [events, loading, error, refreshEvents]);

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error("useEvents must be used within EventsProvider");
  }
  return context;
}
