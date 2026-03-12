import mongoose, { Schema, model, models } from "mongoose";

export interface IBudgetCategory {
  _id?: string;
  name: string;
  color?: string;
  icon?: string;
  description?: string;
  createdAt?: Date;
}

const BudgetCategorySchema = new Schema<IBudgetCategory>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    color: { type: String, default: "#3b82f6" },
    icon: { type: String },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

const BudgetCategory =
  models.BudgetCategory || model<IBudgetCategory>("BudgetCategory", BudgetCategorySchema);

export default BudgetCategory;
