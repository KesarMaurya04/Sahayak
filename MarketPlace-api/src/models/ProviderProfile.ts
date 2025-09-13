import { Schema, model, InferSchemaType } from 'mongoose';

const ProviderProfileSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  displayName: { type: String, required: true, trim: true },
  bio: { type: String },
  categories: [{ type: Schema.Types.ObjectId, ref: 'Category', index: true }],
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' } // [lng, lat]
  },
  address: { type: String },
  serviceRadiusKm: { type: Number, default: 0 } // 0 = remote only
}, { timestamps: true });

export type ProviderProfileDoc = InferSchemaType<typeof ProviderProfileSchema>;
export const ProviderProfile = model<ProviderProfileDoc>('ProviderProfile', ProviderProfileSchema);