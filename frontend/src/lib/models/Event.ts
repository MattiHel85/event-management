export interface IBudgetItem {
  id: string;
  category: string;
  description: string;
  amount: number;
}

export interface IEvent {
  _id?: string;
  createdById?: string;
  organizationId?: string;
  visibility?: "public" | "internal";
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  ticketUrl: string;
  budget?: number;
  currency?: string;
  participationStatus?: "INTERESTED" | "ATTENDING" | null;
  attendingCount?: number;
  budgetItems?: IBudgetItem[];
  budgetId?: string;
  createdAt?: string;
}
