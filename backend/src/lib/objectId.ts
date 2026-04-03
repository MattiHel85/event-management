import mongoose from "mongoose";

export function toObjectId(value: string) {
  const { Types } = mongoose;

  if (!Types.ObjectId.isValid(value)) {
    return null;
  }

  return new Types.ObjectId(value);
}
