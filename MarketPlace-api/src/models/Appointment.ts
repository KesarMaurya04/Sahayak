import { Schema, model, InferSchemaType } from 'mongoose';

const AppointmentSchema = new Schema({
  slotId: { type: Schema.Types.ObjectId, ref: 'AvailabilitySlot', required: true, index: true },
  listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
  providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  priceSnapshot: { type: Number, required: true },
  titleSnapshot: { type: String, required: true },

  status: { type: String, enum: ['pending','confirmed','completed','canceled'], default: 'pending', index: true },

  // simple audit
  canceledReason: { type: String }
}, { timestamps: true });

export type AppointmentDoc = InferSchemaType<typeof AppointmentSchema>;
export const Appointment = model<AppointmentDoc>('Appointment', AppointmentSchema);

