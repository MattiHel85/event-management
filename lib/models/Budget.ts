export interface IBudgetItem {
  _id?: string;
  category: string;
  description: string;
  amount: number;
  status?: "pending" | "approved" | "paid";
  notes?: string;
  createdAt?: Date;
}

export interface IBudget {
  _id?: string;
  eventId: string;
  totalBudget: number;
  currency: string;
  items: IBudgetItem[];
  totalSpent?: number;
  totalRemaining?: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
