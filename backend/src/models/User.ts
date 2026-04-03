import mongoose, { type Model } from "mongoose";

const { Schema, model, models } = mongoose;

export interface IUser {
  name: string | null;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, trim: true, default: null },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "USER" },
  },
  { timestamps: true }
);

export const UserModel = (models.User as Model<IUser> | undefined) ?? model<IUser>("User", userSchema);
