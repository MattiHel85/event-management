import mongoose, { Schema, model, models } from "mongoose";

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
  budget?: number;
  currency?: string;
  budgetItems?: IBudgetItem[];
  budgetId?: string; // Reference to detailed Budget document
  createdAt?: string;
}

const BudgetItemSchema = new Schema<IBudgetItem>(
  {
    id: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    location: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    budget: { type: Number, min: 0 },
    currency: { type: String, default: "USD" },
    budgetItems: { type: [BudgetItemSchema], default: [] },
    budgetId: { type: String, index: true }, // Reference to Budget document for detailed tracking
  },
  { timestamps: true }
);

const Event = models.Event || model<IEvent>("Event", EventSchema);

export default Event;
