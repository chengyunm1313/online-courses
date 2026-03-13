export type SupportTicketCategory =
  | "payment"
  | "refund"
  | "course"
  | "account"
  | "other";

export type SupportTicketStatus = "open" | "in_progress" | "resolved";

export interface SupportTicket {
  id: string;
  name: string;
  email: string;
  category: SupportTicketCategory;
  subject: string;
  message: string;
  orderId?: string;
  status: SupportTicketStatus;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}
