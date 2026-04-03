import mongoose, { type Model, type Types } from "mongoose";

const { Schema, model, models } = mongoose;

export interface IOrganizationMember {
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  role: string;
  joinedAt: Date;
}

const organizationMemberSchema = new Schema<IOrganizationMember>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, default: "MEMBER" },
    joinedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false }
);

organizationMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
organizationMemberSchema.index({ userId: 1 });

export const OrganizationMemberModel =
  (models.OrganizationMember as Model<IOrganizationMember> | undefined) ??
  model<IOrganizationMember>("OrganizationMember", organizationMemberSchema);
