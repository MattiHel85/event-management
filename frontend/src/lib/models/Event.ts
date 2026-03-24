export interface IBudgetItem {
  id: string;
  category: string;
  description: string;
  amount: number;
}

export interface IEvent {
  _id?: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  ticketUrl: string;
  budget?: number;
  currency?: string;
  budgetItems?: IBudgetItem[];
  budgetId?: string;
  createdAt?: string;
}
