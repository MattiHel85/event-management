import mongoose, { Schema, model, models } from "mongoose";

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

const BudgetItemSchema = new Schema<IBudgetItem>(
  {
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "paid"],
      default: "pending",
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true, _id: true }
);

const BudgetSchema = new Schema<IBudget>(
  {
    eventId: { type: String, required: true, index: true },
    totalBudget: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "USD" },
    items: { type: [BudgetItemSchema], default: [] },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

// Virtual for totalSpent
BudgetSchema.virtual("totalSpent").get(function () {
  return this.items.reduce((sum, item) => sum + (item.amount || 0), 0);
});

// Virtual for totalRemaining
BudgetSchema.virtual("totalRemaining").get(function () {
  return this.totalBudget - (this.totalSpent || 0);
});

const Budget = models.Budget || model<IBudget>("Budget", BudgetSchema);

export default Budget;
