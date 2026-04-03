import mongoose, { type Model, type Types } from "mongoose";

const { Schema, model, models } = mongoose;

export interface IEvent {
  createdById: Types.ObjectId | null;
  title: string;
  description: string;
  date: Date;
  location: string;
  capacity: number;
  ticketUrl: string;
  budget: number | null;
  currency: string;
  organizationId: Types.ObjectId | null;
  visibility: "public" | "internal";
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    createdById: { type: Schema.Types.ObjectId, ref: "User", default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    ticketUrl: { type: String, default: "" },
    budget: { type: Number, default: null },
    currency: { type: String, default: "USD" },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", default: null },
    visibility: { type: String, enum: ["public", "internal"], default: "public" },
  },
  { timestamps: true }
);

eventSchema.index({ date: 1 });
eventSchema.index({ organizationId: 1 });

export const EventModel = (models.Event as Model<IEvent> | undefined) ?? model<IEvent>("Event", eventSchema);
