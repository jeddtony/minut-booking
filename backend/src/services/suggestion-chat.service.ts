import { Types } from 'mongoose';
import { SuggestionChatModel, SuggestionChatRole } from '@models/suggestion-chat.model';
import type { ChatTurnForModel } from '@utils/llm/openai-rental-suggestions';

export type SuggestionChatTranscriptMessage = {
  id: string;
  role: SuggestionChatRole;
  content: string;
  createdAt: string;
};

const MAX_STORED_MESSAGES = 50;
const MAX_HISTORY_FOR_MODEL = 20;

export class SuggestionChatService {
  public async getHistoryForModel(userId: string): Promise<ChatTurnForModel[]> {
    const doc = await SuggestionChatModel.findOne({ userId: new Types.ObjectId(userId) }).lean();
    if (!doc?.messages?.length) return [];

    return doc.messages.slice(-MAX_HISTORY_FOR_MODEL).map(m => ({
      role: m.role,
      content: m.content,
    }));
  }

  /** Full transcript for the client UI (markdown content). */
  public async getTranscript(userId: string): Promise<SuggestionChatTranscriptMessage[]> {
    const doc = await SuggestionChatModel.findOne({ userId: new Types.ObjectId(userId) }).lean();
    if (!doc?.messages?.length) return [];
    return doc.messages.map((m, i) => ({
      id: `${i}-${new Date(m.createdAt).getTime()}`,
      role: m.role,
      content: m.content,
      createdAt: new Date(m.createdAt).toISOString(),
    }));
  }

  public async appendExchange(userId: string, userContent: string, assistantContent: string): Promise<void> {
    const uid = new Types.ObjectId(userId);
    const now = new Date();
    const userMsg = { role: 'user' as const, content: userContent, createdAt: now };
    const assistantMsg = { role: 'assistant' as const, content: assistantContent.slice(0, 8000), createdAt: now };

    await SuggestionChatModel.findOneAndUpdate(
      { userId: uid },
      { $push: { messages: { $each: [userMsg, assistantMsg], $slice: -MAX_STORED_MESSAGES } } },
      { upsert: true, new: true },
    );
  }
}
