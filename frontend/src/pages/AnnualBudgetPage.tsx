import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Link, Navigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useEvents } from "../context/EventsContext";
import { fetchBudgetPlans, updateBudgetPlan, deleteBudgetPlan, type BudgetPlan } from "../lib/api/budgets";
import { formatAmount, CURRENCIES } from "../lib/currencies";
import { useSession } from "../context/SessionContext";
import ActionButton from "../components/ActionButton";

const PIE_COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];

const STANDARD_BUDGET_CATEGORIES = ["Venue", "Catering", "Marketing", "Equipment", "Staff", "Other"];

type Scope = "MINE" | "ORG";
type BudgetPeriod = "YEARLY" | "QUARTERLY";

type BudgetRow = {
  id: string;
  event: string;
  budget: number;
  spent: number;
  remaining: number;
  date: string;
  currency: string;
  organizationId?: string;
  organizationName?: string;
  planScopeType: "PERSONAL" | "ORG";
  canManagePlan: boolean;
};

type BudgetSection = {
  key: string;
  scopeType: "PERSONAL" | "ORG";
  organizationId?: string;
  organizationName?: string;
  currency: string;
  plan?: BudgetPlan;
  events: BudgetRow[];
  canManagePlan: boolean;
};

function sectionKey(scopeType: "PERSONAL" | "ORG", currency: string, organizationId?: string) {
  if (scopeType === "ORG") return `ORG:${organizationId ?? ""}:${currency}`;
  return `PERSONAL:${currency}`;
}

function formatMonth(date: Date) {
  return date.toLocaleString("en-US", { month: "short" });
}

function getQuarter(date: Date) {
  return Math.floor(date.getMonth() / 3) + 1;
}

function parseAmountInput(raw: string) {
  const cleaned = raw.replace(/\s+/g, "").replace(/,/g, "");
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function StatCard({
  label,
  value,
  sub,
  color = "text-slate-900",
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub ? <p className="text-xs text-slate-400 mt-1">{sub}</p> : null}
    </div>
  );
}

export default function AnnualBudgetPage() {
  const { user, loading: sessionLoading } = useSession();
  const { events, loading, error } = useEvents();

  const [scope, setScope] = useState<Scope>("ORG");
  const [period, setPeriod] = useState<BudgetPeriod>("YEARLY");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [quarter, setQuarter] = useState<number>(Math.floor(new Date().getMonth() / 3) + 1);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");

  const [plans, setPlans] = useState<BudgetPlan[]>([]);
  const [planAmountsByKey, setPlanAmountsByKey] = useState<Record<string, string>>({});
  const [planCategoriesByKey, setPlanCategoriesByKey] = useState<
    Record<string, Array<{ name: string; amount: string }>>
  >({});
  const [planLoading, setPlanLoading] = useState<boolean>(false);
  const [planSavingKey, setPlanSavingKey] = useState<string | null>(null);
  const [planDeletingKey, setPlanDeletingKey] = useState<string | null>(null);
  const [deleteConfirmingKey, setDeleteConfirmingKey] = useState<string | null>(null);
  const [deleteCode, setDeleteCode] = useState<string>("");
  const [deleteEnteredCode, setDeleteEnteredCode] = useState<string>("");
  const [planError, setPlanError] = useState<string>("");

  const [newPlanCurrency, setNewPlanCurrency] = useState<string>("");
  const [newPlanAmount, setNewPlanAmount] = useState<string>("");
  const [newPlanCategories, setNewPlanCategories] = useState<Array<{ name: string; amount: string }>>([]);
  const [newPlanSaving, setNewPlanSaving] = useState<boolean>(false);
  const [createFormOpen, setCreateFormOpen] = useState<boolean>(false);
  const [categoriesOpen, setCategoriesOpen] = useState<boolean>(false);
  const [sectionCategoriesOpen, setSectionCategoriesOpen] = useState<Record<string, boolean>>({});

  const isPlatformAdmin = user?.role === "PLATFORM_ADMIN";
  const hasCreatedEvent = Boolean(user?.id) && events.some((event) => event.createdById === user?.id);
  const hasPrivilegedOrgRole =
    user?.memberships?.some((membership) => membership.role === "OWNER" || membership.role === "ADMIN") ?? false;
  const canAccessBudgets = isPlatformAdmin || hasCreatedEvent || hasPrivilegedOrgRole;

  const privilegedOrgMemberships = useMemo(() => {
    return (user?.memberships ?? []).filter(
      (membership) => membership.role === "OWNER" || membership.role === "ADMIN"
    );
  }, [user?.memberships]);

  const orgOptions = useMemo(() => {
    const seen = new Set<string>();
    return privilegedOrgMemberships
      .filter((membership) => {
        if (seen.has(membership.organizationId)) return false;
        seen.add(membership.organizationId);
        return true;
      })
      .map((membership) => ({
        id: membership.organizationId,
        name: membership.organization?.name ?? `Organization ${membership.organizationId.slice(-6)}`,
      }));
  }, [privilegedOrgMemberships]);

  const privilegedOrgIds = useMemo(() => new Set(orgOptions.map((org) => org.id)), [orgOptions]);

  const orgNameById = useMemo(() => {
    return new Map(orgOptions.map((org) => [org.id, org.name]));
  }, [orgOptions]);

  useEffect(() => {
    if (scope === "ORG" && !selectedOrgId && orgOptions.length > 0) {
      setSelectedOrgId(orgOptions[0].id);
    }
  }, [orgOptions, scope, selectedOrgId]);

  const scopedEventsForYearOptions = useMemo(() => {
    return events.filter((event) => {
      const orgId = event.organizationId;
      const isMineNoOrg = Boolean(user?.id && event.createdById === user.id && !orgId);
      const isOrgEvent = Boolean(orgId) && orgId === selectedOrgId;
      if (scope === "MINE") return isMineNoOrg;
      return isOrgEvent;
    });
  }, [events, scope, selectedOrgId, user?.id]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const event of scopedEventsForYearOptions) {
      const d = new Date(event.date);
      if (!Number.isNaN(d.getTime())) years.add(d.getFullYear());
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [scopedEventsForYearOptions]);

  const yearlyScopedEvents = useMemo(() => {
    return scopedEventsForYearOptions.filter((event) => {
      const d = new Date(event.date);
      return !Number.isNaN(d.getTime()) && d.getFullYear() === year;
    });
  }, [scopedEventsForYearOptions, year]);

  const currencyOptions = useMemo(() => {
    const currencies = new Set<string>();

    for (const event of yearlyScopedEvents) {
      currencies.add((event.currency ?? "USD").toUpperCase());
    }

    for (const plan of plans) {
      if (!plan || !plan.currency) continue;
      if (plan.year !== year) continue;
      if (scope === "MINE" && plan.scopeType !== "PERSONAL") continue;
      if (scope === "ORG" && (plan.scopeType !== "ORG" || plan.organizationId !== selectedOrgId)) continue;
      currencies.add(plan.currency.toUpperCase());
    }

    return Array.from(currencies).sort((a, b) => a.localeCompare(b));
  }, [plans, scope, selectedOrgId, year, yearlyScopedEvents]);

  const categoryTemplateNames = useMemo(() => {
    const names = new Set<string>();
    for (const event of yearlyScopedEvents) {
      for (const item of event.budgetItems ?? []) {
        const trimmed = item.category.trim();
        if (trimmed) names.add(trimmed);
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [yearlyScopedEvents]);

  useEffect(() => {
    if (availableYears.length === 0) return;
    if (!availableYears.includes(year)) {
      setYear(availableYears[0]);
    }
  }, [availableYears, year]);

  useEffect(() => {
    if (!newPlanCurrency) {
      // Default to first currency from events/plans if available, otherwise first supported currency
      if (currencyOptions.length > 0) {
        setNewPlanCurrency(currencyOptions[0]);
      } else {
        setNewPlanCurrency(CURRENCIES[0].code);
      }
    }
  }, [currencyOptions, newPlanCurrency]);

  useEffect(() => {
    if (!selectedCurrency && currencyOptions.length > 0) {
      setSelectedCurrency(currencyOptions[0]);
    }
  }, [currencyOptions, selectedCurrency]);

  useEffect(() => {
    if (newPlanCategories.length === 0) {
      // Use event categories if available, otherwise use standard categories
      const categoriesToUse = categoryTemplateNames.length > 0 ? categoryTemplateNames : STANDARD_BUDGET_CATEGORIES;
      setNewPlanCategories(categoriesToUse.map((name) => ({ name, amount: "" })));
    }
  }, [categoryTemplateNames, newPlanCategories.length]);

  const newPlanAmountValue = useMemo(() => parseAmountInput(newPlanAmount), [newPlanAmount]);
  const newPlanAssignedAmount = useMemo(
    () =>
      newPlanCategories
        .filter((item) => item.name.trim().length > 0)
        .reduce((sum, item) => sum + parseAmountInput(item.amount), 0),
    [newPlanCategories]
  );
  const newPlanUnassignedAmount = Math.max(newPlanAmountValue - newPlanAssignedAmount, 0);
  const newPlanOverAssigned = newPlanAssignedAmount > newPlanAmountValue;

  useEffect(() => {
    if (sessionLoading || loading || !canAccessBudgets) return;

    const loadPlans = async () => {
      setPlanLoading(true);
      setPlanError("");
      try {
        const data = await fetchBudgetPlans({ year });
        setPlans(Array.isArray(data.plans) ? data.plans : []);
      } catch (err) {
        setPlanError(err instanceof Error ? err.message : "Failed to load budget plans");
      } finally {
        setPlanLoading(false);
      }
    };

    void loadPlans();
  }, [canAccessBudgets, year, loading, sessionLoading]);

  const budgetByEvent = useMemo<BudgetRow[]>(() => {
    const rows: BudgetRow[] = [];

    for (const event of events) {
      if (event.budgetItems === undefined) continue;

      const eventId = event._id ?? "";
      const spent = (event.budgetItems ?? []).reduce((sum, item) => sum + item.amount, 0);
      const currency = event.currency ?? "USD";
      const orgId = event.organizationId;

      const isMineNoOrg = Boolean(user?.id && event.createdById === user.id && !orgId);
      const isOrgEvent = Boolean(orgId) && orgId === selectedOrgId;

      if (scope === "MINE" && !isMineNoOrg) continue;
      if (scope === "ORG" && !isOrgEvent) continue;

      const isPersonal = !orgId;
      const canManagePlan = isPersonal
        ? Boolean(user?.id && event.createdById === user.id)
        : Boolean(orgId && (isPlatformAdmin || privilegedOrgIds.has(orgId)));

      rows.push({
        id: eventId,
        event: event.title,
        budget: event.budget ?? 0,
        spent,
        remaining: (event.budget ?? 0) - spent,
        date: event.date,
        currency,
        organizationId: orgId,
        organizationName: orgId ? orgNameById.get(orgId) ?? `Organization ${orgId.slice(-6)}` : undefined,
        planScopeType: isPersonal ? "PERSONAL" : "ORG",
        canManagePlan,
      });
    }

    return rows.filter((row) => {
      const date = new Date(row.date);
      if (Number.isNaN(date.getTime())) return false;
      if (date.getFullYear() !== year) return false;
      if (period === "YEARLY") return true;
      return getQuarter(date) === quarter;
    });
  }, [events, isPlatformAdmin, orgNameById, period, privilegedOrgIds, quarter, scope, selectedOrgId, user?.id, year]);

  const planBySectionKey = useMemo(() => {
    const map = new Map<string, BudgetPlan>();
    for (const plan of plans) {
      if (!plan || (plan.scopeType !== "PERSONAL" && plan.scopeType !== "ORG")) continue;
      const currency = typeof plan.currency === "string" && plan.currency.trim().length > 0 ? plan.currency : "USD";
      const key = sectionKey(plan.scopeType, currency, plan.organizationId);
      map.set(key, { ...plan, currency });
    }
    return map;
  }, [plans]);

  const sections = useMemo<BudgetSection[]>(() => {
    const groups = new Map<string, BudgetSection>();

    for (const row of budgetByEvent) {
      const key = sectionKey(row.planScopeType, row.currency, row.organizationId);
      const existing = groups.get(key);

      if (existing) {
        existing.events.push(row);
        existing.canManagePlan = existing.canManagePlan || row.canManagePlan;
      } else {
        groups.set(key, {
          key,
          scopeType: row.planScopeType,
          organizationId: row.organizationId,
          organizationName: row.organizationName,
          currency: row.currency,
          plan: planBySectionKey.get(key),
          events: [row],
          canManagePlan: row.canManagePlan,
        });
      }
    }

    for (const plan of plans) {
      if (!plan || (plan.scopeType !== "PERSONAL" && plan.scopeType !== "ORG")) continue;
      const currency = typeof plan.currency === "string" && plan.currency.trim().length > 0 ? plan.currency : "USD";

      if (scope === "MINE" && plan.scopeType !== "PERSONAL") continue;
      if (scope === "ORG" && plan.scopeType !== "ORG") continue;
      if (scope === "ORG" && plan.organizationId !== selectedOrgId) continue;

      const key = sectionKey(plan.scopeType, currency, plan.organizationId);
      if (groups.has(key)) {
        const existing = groups.get(key)!;
        existing.plan = { ...plan, currency };
        continue;
      }

      groups.set(key, {
        key,
        scopeType: plan.scopeType,
        organizationId: plan.organizationId,
        organizationName: plan.organizationName ?? (plan.organizationId ? orgNameById.get(plan.organizationId) : undefined),
        currency,
        plan: { ...plan, currency },
        events: [],
        canManagePlan:
          plan.scopeType === "PERSONAL"
            ? true
            : Boolean(plan.organizationId && (isPlatformAdmin || privilegedOrgIds.has(plan.organizationId))),
      });
    }

    return Array.from(groups.values()).sort((a, b) => {
      if (a.scopeType !== b.scopeType) return String(a.scopeType).localeCompare(String(b.scopeType));
      if ((a.organizationName ?? "") !== (b.organizationName ?? "")) {
        return String(a.organizationName ?? "").localeCompare(String(b.organizationName ?? ""));
      }
      return String(a.currency ?? "").localeCompare(String(b.currency ?? ""));
    });
  }, [budgetByEvent, isPlatformAdmin, orgNameById, planBySectionKey, plans, privilegedOrgIds, scope, selectedOrgId]);

  // Always sync amounts and categories from the backend plans (source of truth).
  // This fixes the bug where a section created without a plan gets planAmountsByKey[key] = "",
  // and the guard `== null` never updates it after the plan is later saved.
  useEffect(() => {
    setPlanAmountsByKey((prev) => {
      const next = { ...prev };
      for (const plan of plans) {
        const currency = plan.currency || "USD";
        const key = sectionKey(plan.scopeType, currency, plan.organizationId);
        next[key] = String(plan.amount);
      }
      // Initialise keys for sections that have no plan yet
      for (const section of sections) {
        if (next[section.key] == null) {
          next[section.key] = "";
        }
      }
      return next;
    });

    setPlanCategoriesByKey((prev) => {
      const next = { ...prev };
      for (const plan of plans) {
        const currency = plan.currency || "USD";
        const key = sectionKey(plan.scopeType, currency, plan.organizationId);
        next[key] =
          plan.categories && plan.categories.length > 0
            ? plan.categories.map((item) => ({
                name: item.name,
                amount: String(item.amount),
              }))
            : STANDARD_BUDGET_CATEGORIES.map((name) => ({ name, amount: "0" }));
      }
      for (const section of sections) {
        if (next[section.key] == null) {
          next[section.key] = STANDARD_BUDGET_CATEGORIES.map((name) => ({ name, amount: "0" }));
        }
      }
      return next;
    });
  }, [plans, sections]);

  const savePlan = async (section: BudgetSection) => {
    if (!section.canManagePlan) return;

    const amount = parseAmountInput(planAmountsByKey[section.key] ?? "");
    const categories = (planCategoriesByKey[section.key] ?? [])
      .map((item) => ({
        name: item.name.trim(),
        amount: parseAmountInput(item.amount),
      }))
      .filter((item) => item.name.length > 0);
    const categoriesTotal = categories.reduce((sum, item) => sum + item.amount, 0);

    if (categoriesTotal > amount) {
      setPlanError(`Categories exceed total plan by ${formatAmount(categoriesTotal - amount, section.currency)}. Reduce category totals before saving.`);
      return;
    }

    setPlanSavingKey(section.key);
    setPlanError("");
    try {
      const saved = await updateBudgetPlan({
        scopeType: section.scopeType,
        organizationId: section.organizationId,
        year,
        currency: section.currency,
        amount,
        categories,
      });

      setPlans((prev) => {
        const key = sectionKey(saved.scopeType, saved.currency, saved.organizationId);
        const idx = prev.findIndex((plan) => sectionKey(plan.scopeType, plan.currency, plan.organizationId) === key);
        if (idx === -1) return [...prev, saved];
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      });

      setPlanAmountsByKey((prev) => ({
        ...prev,
        [section.key]: String(saved.amount),
      }));
      setPlanCategoriesByKey((prev) => ({
        ...prev,
        [section.key]: (saved.categories ?? []).map((item) => ({
          name: item.name,
          amount: String(item.amount),
        })),
      }));
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : "Failed to save budget plan");
    } finally {
      setPlanSavingKey(null);
    }
  };

  const generateDeleteCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i += 1) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const startDeletePlan = (section: BudgetSection) => {
    if (!section.plan?.id || !section.canManagePlan) return;
    const code = generateDeleteCode();
    setDeleteCode(code);
    setDeleteEnteredCode("");
    setPlanError("");
    setDeleteConfirmingKey(section.key);
  };

  const cancelDeletePlan = () => {
    setDeleteConfirmingKey(null);
    setDeleteCode("");
    setDeleteEnteredCode("");
  };

  const deletePlan = async (section: BudgetSection) => {
    if (!section.plan?.id || !section.canManagePlan) return;
    if (deleteEnteredCode.trim().toUpperCase() !== deleteCode) {
      setPlanError("Delete code does not match.");
      return;
    }
    setPlanDeletingKey(section.key);
    setPlanError("");
    try {
      await deleteBudgetPlan(section.plan.id);
      setPlans((prev) => prev.filter((p) => p.id !== section.plan!.id));
      setPlanAmountsByKey((prev) => {
        const next = { ...prev };
        delete next[section.key];
        return next;
      });
      setPlanCategoriesByKey((prev) => {
        const next = { ...prev };
        delete next[section.key];
        return next;
      });
      setDeleteConfirmingKey(null);
      setDeleteCode("");
      setDeleteEnteredCode("");
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : "Failed to delete budget plan");
    } finally {
      setPlanDeletingKey(null);
    }
  };

  const createAnnualPlan = async () => {
    const scopeType = scope === "MINE" ? "PERSONAL" : "ORG";
    if (scopeType === "ORG" && !selectedOrgId) {
      setPlanError("Select an organization before creating a budget.");
      return;
    }

    const currency = newPlanCurrency.trim().toUpperCase();
    if (!currency) {
      setPlanError("Currency is required.");
      return;
    }

    const amount = parseAmountInput(newPlanAmount);
    if (!amount) {
      setPlanError("Amount must be greater than 0.");
      return;
    }

    const categories = newPlanCategories
      .map((item) => ({ name: item.name.trim(), amount: parseAmountInput(item.amount) }))
      .filter((item) => item.name.length > 0);
    const categoriesTotal = categories.reduce((sum, item) => sum + item.amount, 0);

    if (categoriesTotal > amount) {
      setPlanError(`Categories exceed total plan by ${formatAmount(categoriesTotal - amount, currency)}. Reduce category totals before saving.`);
      return;
    }

    setNewPlanSaving(true);
    setPlanError("");

    try {
      const saved = await updateBudgetPlan({
        scopeType,
        organizationId: scopeType === "ORG" ? selectedOrgId : undefined,
        year,
        currency,
        amount,
        categories,
      });

      setPlans((prev) => {
        const key = sectionKey(saved.scopeType, saved.currency, saved.organizationId);
        const idx = prev.findIndex((plan) => sectionKey(plan.scopeType, plan.currency, plan.organizationId) === key);
        if (idx === -1) return [...prev, saved];
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      });

      const key = sectionKey(saved.scopeType, saved.currency, saved.organizationId);
      setPlanAmountsByKey((prev) => ({ ...prev, [key]: String(saved.amount) }));
      setPlanCategoriesByKey((prev) => ({
        ...prev,
        [key]: (saved.categories ?? []).map((item) => ({
          name: item.name,
          amount: String(item.amount),
        })),
      }));

      // Reset form
      setNewPlanCurrency(currencyOptions.length > 0 ? currencyOptions[0] : "");
      setNewPlanAmount("");
      setNewPlanCategories(STANDARD_BUDGET_CATEGORIES.map((name) => ({ name, amount: "" })));
    } catch (err) {
      console.error("Failed to create annual budget plan:", err);
      setPlanError(err instanceof Error ? err.message : "Failed to create annual budget plan");
    } finally {
      setNewPlanSaving(false);
    }
  };

  if (sessionLoading || loading) {
    return <div className="text-slate-600">Loading budgets...</div>;
  }

  if (!canAccessBudgets) {
    return <Navigate to="/dashboard" replace />;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Budget Plans</h2>
        <div className="grid gap-3 md:grid-cols-5">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as Scope)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="MINE">Personal budgets (non-org events)</option>
            <option value="ORG">Organization budgets</option>
          </select>

          {scope === "ORG" ? (
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {orgOptions.length === 0 ? (
                <option value="">No organizations</option>
              ) : (
                orgOptions.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))
              )}
            </select>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              Only events without organization are included.
            </div>
          )}

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as BudgetPeriod)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="YEARLY">Yearly</option>
            <option value="QUARTERLY">Quarterly</option>
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            disabled={availableYears.length === 0}
          >
            {availableYears.length === 0 ? (
              <option value={year}>No event years</option>
            ) : (
              availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))
            )}
          </select>

          <select
            value={quarter}
            onChange={(e) => setQuarter(Number(e.target.value))}
            disabled={period !== "QUARTERLY"}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
          >
            <option value={1}>Q1</option>
            <option value={2}>Q2</option>
            <option value={3}>Q3</option>
            <option value={4}>Q4</option>
          </select>

          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            disabled={currencyOptions.length === 0}
          >
            {currencyOptions.length === 0 ? (
              <option value="">No currencies</option>
            ) : (
              currencyOptions.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))
            )}
          </select>
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setCreateFormOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <span className={`text-xs transition-transform ${createFormOpen ? "rotate-180" : ""}`}>▼</span>
            {createFormOpen ? "Hide" : "Create Annual Budget Plan"}
          </button>

          {createFormOpen && (
            <div className="mt-3 rounded-xl border border-slate-200 p-4">
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                <select
                  value={newPlanCurrency}
                  onChange={(e) => setNewPlanCurrency(e.target.value)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Select currency</option>
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.flag} {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  inputMode="numeric"
                  value={newPlanAmount}
                  onChange={(e) => setNewPlanAmount(e.target.value.replace(/[^\d\s,]/g, ""))}
                  placeholder="Annual amount"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <ActionButton
                  label={newPlanSaving ? "Saving" : "Save Annual Plan"}
                  onClick={() => void createAnnualPlan()}
                  disabled={newPlanSaving || newPlanOverAssigned}
                  variant="primary"
                />
              </div>

              <p className={`mt-2 text-xs ${newPlanOverAssigned ? "text-red-600" : "text-slate-500"}`}>
                {!newPlanOverAssigned
                  ? `Unassigned budget: ${formatAmount(newPlanUnassignedAmount, newPlanCurrency || "USD")}`
                  : ""}
              </p>

              {newPlanOverAssigned ? (
                <div className="mt-2 rounded-lg border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  Categories exceed plan by {formatAmount(newPlanAssignedAmount - newPlanAmountValue, newPlanCurrency || "USD")}. Reduce category totals before saving.
                </div>
              ) : null}

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setCategoriesOpen((prev) => !prev)}
                  className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  <span className={`transition-transform ${categoriesOpen ? "rotate-180" : ""}`}>▼</span>
                  {categoriesOpen ? "Hide Categories" : "Show Categories"}
                </button>

                {categoriesOpen && (
                  <div className="mt-2 space-y-2">
                    {newPlanCategories.length === 0 ? (
                      <p className="text-xs text-slate-500">No categories yet.</p>
                    ) : (
                      newPlanCategories.map((item, idx) => (
                        <div key={`new-plan-cat-${idx}`} className="grid grid-cols-[1fr_160px_auto] gap-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              setNewPlanCategories((prev) => {
                                const list = [...prev];
                                list[idx] = { ...list[idx], name: e.target.value };
                                return list;
                              })
                            }
                            placeholder="Category name"
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                          />
                          <input
                            type="text"
                            inputMode="numeric"
                            value={item.amount}
                            onChange={(e) =>
                              setNewPlanCategories((prev) => {
                                const list = [...prev];
                                list[idx] = { ...list[idx], amount: e.target.value.replace(/[^\d\s,]/g, "") };
                                return list;
                              })
                            }
                            placeholder="0"
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setNewPlanCategories((prev) => {
                                const list = [...prev];
                                list.splice(idx, 1);
                                return list;
                              })
                            }
                            className="rounded-md border border-slate-300 bg-white px-2 py-2 text-xs text-slate-600 hover:bg-slate-50"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {planLoading ? <p className="mt-3 text-sm text-slate-500">Loading budget plans...</p> : null}
        {planError ? <p className="mt-3 text-sm text-red-500">{planError}</p> : null}
      </div>

      {scope === "ORG" && orgOptions.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-sm text-slate-600 shadow-sm">
          You are not admin/owner in any organization budgets.
        </div>
      ) : sections.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-sm text-slate-600 shadow-sm">
          No budget sections found for this view.
        </div>
      ) : (
        sections.filter((section) => section.currency === selectedCurrency).map((section) => {
          const plannedAmount = parseAmountInput(planAmountsByKey[section.key] ?? "");
          const sectionCategoryAssigned = (planCategoriesByKey[section.key] ?? [])
            .filter((item) => item.name.trim().length > 0)
            .reduce((sum, item) => sum + parseAmountInput(item.amount), 0);
          const sectionUnassignedAmount = Math.max(plannedAmount - sectionCategoryAssigned, 0);
          const sectionOverAssigned = sectionCategoryAssigned > plannedAmount;
          const totalSpent = section.events.reduce((sum, row) => sum + row.spent, 0);
          const totalEventBudgets = section.events.reduce((sum, row) => sum + row.budget, 0);
          const remaining = plannedAmount - totalSpent;

          const spendingOverTime = (() => {
            const monthMap = new Map<string, number>();
            for (const row of section.events) {
              const date = new Date(row.date);
              const key = formatMonth(date);
              monthMap.set(key, (monthMap.get(key) ?? 0) + row.spent);
            }
            return Array.from(monthMap.entries()).map(([month, spent]) => ({ month, spent }));
          })();

          const breakdown = (() => {
            const eventIds = new Set(section.events.map((row) => row.id));
            const categoryMap = new Map<string, number>();
            for (const event of events) {
              const eventId = event._id ?? "";
              if (!eventIds.has(eventId)) continue;
              for (const item of event.budgetItems ?? []) {
                categoryMap.set(item.category, (categoryMap.get(item.category) ?? 0) + item.amount);
              }
            }
            return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
          })();

          const categoryComparison = (() => {
            const spentMap = new Map<string, number>();
            for (const { name, value } of breakdown) {
              spentMap.set(name, value);
            }
            const annualCategories = planCategoriesByKey[section.key] ?? [];
            if (annualCategories.length > 0) {
              return annualCategories.map((cat) => ({
                name: cat.name,
                planned: parseAmountInput(cat.amount),
                spent: spentMap.get(cat.name) ?? 0,
              }));
            }
            return breakdown.map((b) => ({ name: b.name, planned: 0, spent: b.value }));
          })();

          const quarterRows = [1, 2, 3, 4].map((q) => {
            const spent = section.events
              .filter((row) => getQuarter(new Date(row.date)) === q)
              .reduce((sum, row) => sum + row.spent, 0);
            const planned = plannedAmount / 4;
            return {
              quarter: `Q${q}`,
              planned,
              spent,
              remaining: planned - spent,
            };
          });

          return (
            <div key={section.key} className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {section.scopeType === "PERSONAL"
                      ? `Personal Budget (${section.currency})`
                      : `${section.organizationName ?? "Organization"} (${section.currency})`}
                  </h2>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={planAmountsByKey[section.key] ?? ""}
                      placeholder="0"
                      onFocus={(e) => {
                        e.currentTarget.select();
                      }}
                      onChange={(e) => {
                        const next = e.target.value.replace(/[^\d\s,]/g, "");
                        setPlanAmountsByKey((prev) => ({ ...prev, [section.key]: next }));
                      }}
                      className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <ActionButton
                      label={planSavingKey === section.key ? "Saving..." : section.plan ? "Save Plan" : "Create Plan"}
                      onClick={() => void savePlan(section)}
                      disabled={planSavingKey === section.key || !section.canManagePlan || sectionOverAssigned}
                      variant="primary"
                    />
                    {section.plan && section.canManagePlan && deleteConfirmingKey !== section.key && (
                      <button
                        type="button"
                        onClick={() => startDeletePlan(section)}
                        disabled={planDeletingKey === section.key}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {deleteConfirmingKey === section.key && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 space-y-3">
                    <p className="text-sm text-red-700">
                      Are you sure you want to delete this budget plan? Type{" "}
                      <span className="font-semibold">{deleteCode}</span> to confirm.
                    </p>
                    <input
                      type="text"
                      value={deleteEnteredCode}
                      onChange={(e) => setDeleteEnteredCode(e.target.value.toUpperCase())}
                      className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-900"
                      placeholder="Enter delete code"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void deletePlan(section)}
                        disabled={planDeletingKey === section.key}
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {planDeletingKey === section.key ? "Deleting..." : "Confirm Delete"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelDeletePlan}
                        disabled={planDeletingKey === section.key}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <p className="mb-4 text-xs text-slate-500">
                  Showing {period === "YEARLY" ? `full year ${year}` : `Q${quarter} of ${year}`}
                </p>

                {sectionOverAssigned ? (
                  <div className="mb-4 rounded-lg border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    Categories exceed plan by {formatAmount(sectionCategoryAssigned - plannedAmount, section.currency)}. Reduce category totals before saving.
                  </div>
                ) : null}

                {!section.plan && section.events.length > 0 ? (
                  <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Events exist in {section.currency} but no yearly budget plan is set. Create a yearly plan for this currency.
                  </p>
                ) : null}

                <div className="mb-6">
                  <button
                    type="button"
                    onClick={() =>
                      setSectionCategoriesOpen((prev) => ({ ...prev, [section.key]: !prev[section.key] }))
                    }
                    className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                  >
                    <span className={`text-xs transition-transform ${sectionCategoriesOpen[section.key] ? "rotate-180" : ""}`}>▼</span>
                    Yearly Budget Categories
                    {(planCategoriesByKey[section.key] ?? []).length > 0 && (
                      <span className="text-xs text-slate-400">({(planCategoriesByKey[section.key] ?? []).length})</span>
                    )}
                  </button>

                  {sectionCategoriesOpen[section.key] && (
                    <div className="mt-3 rounded-xl border border-slate-200 p-4 space-y-2">
                      <p className="text-xs text-slate-500">
                        Unassigned budget: {formatAmount(sectionUnassignedAmount, section.currency)}
                      </p>
                      {(planCategoriesByKey[section.key] ?? []).length === 0 ? (
                        <p className="text-xs text-slate-500">No yearly categories yet.</p>
                      ) : (
                        (planCategoriesByKey[section.key] ?? []).map((item, idx) => (
                          <div key={`${section.key}-cat-${idx}`} className="grid grid-cols-[1fr_180px] gap-2">
                            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                              {item.name}
                            </div>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.amount}
                              onChange={(e) => {
                                const next = e.target.value.replace(/[^\d\s,]/g, "");
                                setPlanCategoriesByKey((prev) => {
                                  const list = [...(prev[section.key] ?? [])];
                                  list[idx] = { ...list[idx], amount: next };
                                  return { ...prev, [section.key]: list };
                                });
                              }}
                              placeholder="0"
                              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                            />
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-5 gap-6">
                  <StatCard
                    label={`Yearly Budget Plan (${section.currency})`}
                    value={formatAmount(plannedAmount, section.currency)}
                    sub="Annual planned budget"
                  />
                  <StatCard
                    label={`Event Budgets Total (${section.currency})`}
                    value={formatAmount(totalEventBudgets, section.currency)}
                    sub="Sum of event budget limits"
                  />
                  <StatCard
                    label={`Spent Total (${section.currency})`}
                    value={formatAmount(totalSpent, section.currency)}
                    sub={plannedAmount > 0 ? `${Math.round((totalSpent / plannedAmount) * 100)}% of yearly plan` : "No yearly plan yet"}
                    color="text-blue-600"
                  />
                  <StatCard
                    label={`Yearly Remaining (${section.currency})`}
                    value={formatAmount(remaining, section.currency)}
                    sub={remaining >= 0 ? "Under yearly plan" : "Over yearly plan"}
                    color={remaining >= 0 ? "text-emerald-600" : "text-red-500"}
                  />
                  <StatCard
                    label={`${sectionOverAssigned ? "Category Over-Assigned" : "Category Unassigned"} (${section.currency})`}
                    value={formatAmount(
                      sectionOverAssigned ? sectionCategoryAssigned - plannedAmount : sectionUnassignedAmount,
                      section.currency
                    )}
                    sub={
                      sectionOverAssigned
                        ? "Categories exceed yearly plan"
                        : "Budget not assigned to categories"
                    }
                    color={sectionOverAssigned ? "text-red-600" : "text-amber-600"}
                  />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 mb-6">Yearly Plan Split by Quarter</h3>
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  {quarterRows.map((q) => (
                    <div key={q.quarter} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-800 mb-1">{q.quarter}</p>
                      <p className="text-xs text-slate-500">Planned: {formatAmount(q.planned, section.currency)}</p>
                      <p className="text-xs text-slate-500">Spent: {formatAmount(q.spent, section.currency)}</p>
                      <p className={`text-xs mt-1 ${q.remaining >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        Remaining: {formatAmount(q.remaining, section.currency)}
                      </p>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={quarterRows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="quarter" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
                      formatter={(value, name) => [formatAmount(Number(value), section.currency), String(name)]}
                    />
                    <Legend wrapperStyle={{ fontSize: 13 }} />
                    <Bar dataKey="planned" name="Quarter Plan" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spent" name="Quarter Spent" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 mb-6">Annual Budget Share vs Spent by Event</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={section.events.map((row) => ({
                      ...row,
                      annualShare: section.events.length > 0 ? plannedAmount / section.events.length : 0,
                    }))}
                    barGap={4}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="event" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
                      formatter={(value, name) => [formatAmount(Number(value), section.currency), String(name)]}
                    />
                    <Legend wrapperStyle={{ fontSize: 13 }} />
                    <Bar dataKey="annualShare" name="Annual Budget Share" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spent" name="Spent" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900 mb-6">Spending Over Time</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={spendingOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
                        formatter={(value) => [formatAmount(Number(value), section.currency), "Spent"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="spent"
                        name="Spent"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "#2563eb" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900 mb-6">Annual Budget vs Spent by Category</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={categoryComparison} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
                        formatter={(value, name) => [formatAmount(Number(value), section.currency), String(name)]}
                      />
                      <Legend wrapperStyle={{ fontSize: 13 }} />
                      <Bar dataKey="planned" name="Annual Budget" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="spent" name="Spent" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 mb-4">Event Budgets</h3>
                {section.events.length === 0 ? (
                  <p className="text-sm text-slate-600">No events in this budget section yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-slate-600">
                          <th className="py-2 pr-4">Event</th>
                          <th className="py-2 pr-4">Event Budget</th>
                          <th className="py-2 pr-4">Spent</th>
                          <th className="py-2 pr-4">Remaining</th>
                          <th className="py-2 pr-4">Link</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.events.map((row) => (
                          <tr key={row.id} className="border-b border-slate-100 text-slate-800">
                            <td className="py-2 pr-4">{row.event}</td>
                            <td className="py-2 pr-4">{formatAmount(row.budget, section.currency)}</td>
                            <td className="py-2 pr-4">{formatAmount(row.spent, section.currency)}</td>
                            <td className={`py-2 pr-4 ${row.remaining < 0 ? "text-red-500" : "text-emerald-600"}`}>
                              {formatAmount(row.remaining, section.currency)}
                            </td>
                            <td className="py-2 pr-4">
                              <Link className="text-blue-600 hover:text-blue-500" to={`/events/${row.id}/budget`}>
                                View event budget
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
