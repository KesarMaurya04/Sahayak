import { Schema, model, InferSchemaType } from 'mongoose';

const ListingSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  ownerType: { type: String, enum: ['individual','business'], required: true, index: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String },
  media: [{ type: String }],
  pricingType: { type: String, enum: ['fixed','hourly'], default: 'fixed' },
  price: { type: Number, required: true, min: 0 },
  onSite: { type: Boolean, default: false },
  durationMinutes: { type: Number },
  attributes: { type: Schema.Types.Mixed },
  isActive: { type: Boolean, default: true },

  // Moderation
  moderationStatus: { type: String, enum: ['pending','approved','rejected'], default: 'pending', index: true },
  moderationNote: { type: String },

  // Ratings aggregates
  ratingsCount: { type: Number, default: 0 },
  avgRating: { type: Number, default: 0 },

  // Geo for search
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' }
  }
}, { timestamps: true });

ListingSchema.index({ title: 'text', description: 'text' });

export type ListingDoc = InferSchemaType<typeof ListingSchema>;
export const Listing = model<ListingDoc>('Listing', ListingSchema);