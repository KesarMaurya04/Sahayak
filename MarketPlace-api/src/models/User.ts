import { Schema, model, InferSchemaType } from 'mongoose';
import bcrypt from 'bcryptjs';

export const USER_ROLES = ['customer', 'provider_individual', 'provider_business', 'admin'] as const;
export type UserRole = typeof USER_ROLES[number];

const UserSchema = new Schema({
  name: { type: String, trim: true, required: true },
  email: { type: String, required: true, unique: true, index: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: USER_ROLES, default: 'customer', index: true }
}, { timestamps: true });

// hash on create/update
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  // @ts-ignore (Mongoose doc typing)
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// instance method
// @ts-ignore (Mongoose doc typing)
UserSchema.methods.comparePassword = function (candidate: string) {
  // @ts-ignore
  return bcrypt.compare(candidate, this.password);
};

export type UserDoc = InferSchemaType<typeof UserSchema> & {
  comparePassword(candidate: string): Promise<boolean>
};

export const User = model<UserDoc>('User', UserSchema);