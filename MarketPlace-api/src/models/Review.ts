import { Schema, model, InferSchemaType } from 'mongoose';
import { Listing } from './Listing';

const ReviewSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true, index: true },
  listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
  providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String }
}, { timestamps: true });

ReviewSchema.index({ listingId: 1, customerId: 1 });

ReviewSchema.post('save', async function (doc) {
  // recompute aggregates on listing
  const agg = await (this.constructor as any).aggregate([
    { $match: { listingId: doc.listingId } },
    { $group: { _id: '$listingId', count: { $sum: 1 }, avg: { $avg: '$rating' } } }
  ]);
  const { count = 0, avg = 0 } = agg[0] || {};
  await Listing.findByIdAndUpdate(doc.listingId, { ratingsCount: count, avgRating: Math.round(avg * 10) / 10 });
});

export type ReviewDoc = InferSchemaType<typeof ReviewSchema>;
export const Review = model<ReviewDoc>('Review', ReviewSchema);