export type AdminTicketStatus = 'open' | 'in_progress' | 'resolved';

export type AdminTicketMessage = {
  _id: string;
  senderType: 'user' | 'admin';   // your backend uses these
  text: string;
  createdAt: string;
};

export type AdminTicket = {
  _id: string;
  subject: string;
  category?: string;
  status: AdminTicketStatus;
  assignedTo?: string;
  messages?: AdminTicketMessage[];
  createdAt: string;
  updatedAt: string;
};

export type SupportArticle = {
  _id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
};