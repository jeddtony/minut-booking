import mongoose, { Document, Schema, Types } from 'mongoose';

export type SuggestionChatRole = 'user' | 'assistant';

export interface ISuggestionChatMessage {
  role: SuggestionChatRole;
  content: string;
  createdAt: Date;
}

export interface ISuggestionChat extends Document {
  userId: Types.ObjectId;
  messages: ISuggestionChatMessage[];
}

const suggestionChatMessageSchema = new Schema<ISuggestionChatMessage>(
  {
    role: { type: String, required: true, enum: ['user', 'assistant'] },
    content: { type: String, required: true, maxlength: 8000 },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const suggestionChatSchema = new Schema<ISuggestionChat>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    messages: { type: [suggestionChatMessageSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const SuggestionChatModel = mongoose.model<ISuggestionChat>('SuggestionChat', suggestionChatSchema);
