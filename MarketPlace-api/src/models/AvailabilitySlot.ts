import { Schema, model, InferSchemaType } from 'mongoose';

const AvailabilitySlotSchema = new Schema({
  listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
  providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  start: { type: Date, required: true, index: true },
  end: { type: Date, required: true },
  capacity: { type: Number, default: 1, min: 1 },
  bookedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

AvailabilitySlotSchema.index({ listingId: 1, start: 1 }, { unique: true });

export type AvailabilitySlotDoc = InferSchemaType<typeof AvailabilitySlotSchema>;
export const AvailabilitySlot = model<AvailabilitySlotDoc>('AvailabilitySlot', AvailabilitySlotSchema);