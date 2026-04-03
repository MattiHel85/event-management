import mongoose, { type Model, type Types } from "mongoose";

const { Schema, model, models } = mongoose;

export interface IBudgetPlan {
  categories: Array<{
    name: string;
    amount: number;
  }>;
  scopeType: "PERSONAL" | "ORG";
  ownerUserId?: Types.ObjectId;
  organizationId?: Types.ObjectId;
  period: string;
  quarter: number;
  year: number;
  currency: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const budgetPlanSchema = new Schema<IBudgetPlan>(
  {
    scopeType: { type: String, enum: ["PERSONAL", "ORG"], required: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User" },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
    period: { type: String, required: true },
    quarter: { type: Number, required: true, default: 0 },
    year: { type: Number, required: true },
    currency: { type: String, required: true, uppercase: true, trim: true },
    categories: [
      {
        name: { type: String, required: true, trim: true },
        amount: { type: Number, required: true, min: 0 },
      },
    ],
    amount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

budgetPlanSchema.index(
  { scopeType: 1, ownerUserId: 1, year: 1 },
  { unique: true, partialFilterExpression: { scopeType: "PERSONAL" } }
);
budgetPlanSchema.index(
  { scopeType: 1, organizationId: 1, year: 1, currency: 1 },
  { unique: true, partialFilterExpression: { scopeType: "ORG" } }
);

export const BudgetPlanModel =
  (models.BudgetPlan as Model<IBudgetPlan> | undefined) ?? model<IBudgetPlan>("BudgetPlan", budgetPlanSchema);
