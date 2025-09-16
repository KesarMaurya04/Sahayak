import { Schema, model, InferSchemaType } from 'mongoose';

const PasswordResetSchema = new Schema({
  email: { type: String, required: true, index: true, lowercase: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL by value
}, { timestamps: true });

export type PasswordResetDoc = InferSchemaType<typeof PasswordResetSchema>;
export const PasswordReset = model<PasswordResetDoc>('PasswordReset', PasswordResetSchema);