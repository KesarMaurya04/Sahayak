export type TicketStatus = 'open' | 'pending' | 'awaiting_customer' | 'resolved' | 'closed';

export type Ticket = {
  _id: string;
  subject: string;
  categoryId?: string | null;
  categoryName?: string;
  createdBy: string;         // user id
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
};

export type TicketMessage = {
  _id: string;
  ticketId: string;
  authorType: 'user' | 'agent' | 'ai';
  authorName?: string;
  text: string;
  createdAt: string;
};

export type TicketDetailResponse = {
  item: Ticket;
  messages: TicketMessage[];
  ai?: {
    suggestedAnswer?: string;
    ctx?: Array<{ title: string; snippet: string; score?: number }>;
  };
};