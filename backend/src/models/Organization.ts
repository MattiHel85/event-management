import mongoose, { type Model } from "mongoose";

const { Schema, model, models } = mongoose;

export interface IOrganization {
  name: string;
  slug: string;
  joinCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    joinCode: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export const OrganizationModel =
  (models.Organization as Model<IOrganization> | undefined) ?? model<IOrganization>("Organization", organizationSchema);
