import mongoose, { type Model, type Types } from "mongoose";

const { Schema, model, models } = mongoose;

export interface IBudgetItem {
  eventId: Types.ObjectId;
  category: string;
  description: string;
  amount: number;
  createdAt: Date;
}

const budgetItemSchema = new Schema<IBudgetItem>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

budgetItemSchema.index({ eventId: 1 });

export const BudgetItemModel = (models.BudgetItem as Model<IBudgetItem> | undefined) ??
  model<IBudgetItem>("BudgetItem", budgetItemSchema);
