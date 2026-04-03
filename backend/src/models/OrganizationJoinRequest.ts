import mongoose, { type Model, type Types } from "mongoose";

const { Schema, model, models } = mongoose;

export interface IOrganizationJoinRequest {
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  status: "PENDING" | "APPROVED" | "DECLINED";
  createdAt: Date;
  updatedAt: Date;
}

const organizationJoinRequestSchema = new Schema<IOrganizationJoinRequest>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["PENDING", "APPROVED", "DECLINED"], default: "PENDING" },
  },
  { timestamps: true }
);

organizationJoinRequestSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
organizationJoinRequestSchema.index({ status: 1 });

export const OrganizationJoinRequestModel =
  (models.OrganizationJoinRequest as Model<IOrganizationJoinRequest> | undefined) ??
  model<IOrganizationJoinRequest>("OrganizationJoinRequest", organizationJoinRequestSchema);
