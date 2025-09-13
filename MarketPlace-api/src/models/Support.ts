import { Schema, model, InferSchemaType } from 'mongoose';

const SupportArticleSchema = new Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  category: { type: String, default: 'general', index: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

SupportArticleSchema.index({ title: 'text', body: 'text' });

export type SupportArticleDoc = InferSchemaType<typeof SupportArticleSchema>;
export const SupportArticle = model<SupportArticleDoc>('SupportArticle', SupportArticleSchema);

const MessageSchema = new Schema({
  senderType: { type: String, enum: ['user','admin'], required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const TicketSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject: { type: String, required: true },
  category: { type: String, default: 'general', index: true },
  status: { type: String, enum: ['open','in_progress','resolved'], default: 'open', index: true },
  messages: [MessageSchema],
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export type TicketDoc = InferSchemaType<typeof TicketSchema>;
export const Ticket = model<TicketDoc>('Ticket', TicketSchema);