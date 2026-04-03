import mongoose, { type Model, type Types } from "mongoose";

const { Schema, model, models } = mongoose;

export interface IEventParticipation {
  eventId: Types.ObjectId;
  userId: Types.ObjectId;
  status: "INTERESTED" | "ATTENDING";
  createdAt: Date;
  updatedAt: Date;
}

const eventParticipationSchema = new Schema<IEventParticipation>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["INTERESTED", "ATTENDING"], required: true },
  },
  { timestamps: true }
);

eventParticipationSchema.index({ eventId: 1, userId: 1 }, { unique: true });
eventParticipationSchema.index({ userId: 1, status: 1 });

export const EventParticipationModel =
  (models.EventParticipation as Model<IEventParticipation> | undefined) ??
  model<IEventParticipation>("EventParticipation", eventParticipationSchema);
