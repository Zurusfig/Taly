export type TransactionType = 'expense' | 'income' | 'transfer';
export type WalletType = 'cash' | 'bank' | 'credit' | 'other';
export type CategoryKind = 'expense' | 'income';

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: WalletType;
  initial_balance: number;
  currency: string;
  icon: string | null;
  color: string | null;
  archived: boolean;
  created_at: string;
  // computed client-side
  balance: number;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  kind: CategoryKind;
  icon: string | null;
  color: string | null;
  archived: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  to_wallet_id: string | null;
  note: string | null;
  occurred_at: string;
  created_at: string;
}

export interface MonthlyStats {
  income: number;
  expense: number;
  net: number;
}

export type AssetType = 'stock' | 'etf' | 'gold' | 'crypto' | 'other';

export interface Asset {
  id: string;
  user_id: string;
  type: AssetType;
  symbol: string | null;
  name: string;
  quantity: number;
  avg_cost_per_unit: number | null;
  currency: string;
  last_price: number | null;
  last_price_updated_at: string | null;
  created_at: string;
}

export type SubscriptionCycle = 'weekly' | 'monthly' | 'yearly';

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  wallet_id: string;
  category_id: string | null;
  cycle: SubscriptionCycle;
  cycle_anchor_date: string;
  next_charge_date: string;
  active: boolean;
  created_at: string;
}
