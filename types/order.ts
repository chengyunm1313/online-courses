export type OrderStatus = 'CREATED' | 'PAID' | 'FAILED' | 'CANCELED' | 'pending' | 'completed' | 'cancelled' | 'refunded';
export type PaymentMethod = 'CREDIT' | 'ATM' | 'credit_card' | 'paypal' | 'bank_transfer' | 'other';

export interface OrderItem {
  courseId: string;
  courseTitle: string;
  courseThumbnail: string;
  price: number;
  instructor: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  notes?: string;
  // ECPay 相關欄位
  merchantTradeNo?: string;
  ecpayData?: {
    RtnCode?: number;
    RtnMsg?: string;
    TradeNo?: string;
    TradeAmt?: number;
    PaymentDate?: string;
    PaymentType?: string;
    card4no?: string;
    card6no?: string;
    AuthCode?: string;
  };
  paidAt?: Date;
  failedAt?: Date;
  canceledAt?: Date;
  shippingMethod?: 'HOME' | 'STORE';
}

export interface OrderFilters {
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  averageOrderValue: number;
}
