import { Schema, model, InferSchemaType } from 'mongoose';

const RefreshTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  tokenHash: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-prune past expiry

export type RefreshTokenDoc = InferSchemaType<typeof RefreshTokenSchema>;
export const RefreshToken = model<RefreshTokenDoc>('RefreshToken', RefreshTokenSchema);
