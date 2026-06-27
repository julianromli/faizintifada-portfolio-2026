export type OrderStatus = 'pending' | 'paid' | 'refunded';

export interface Order {
  id: number;
  name?: string;
  email: string;
  mobile?: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  mayarRef?: string;
  mayarPaymentId?: string;
  couponCode?: string;
  createdAt: number;
  paidAt?: number;
  emailSentAt?: number;
}
