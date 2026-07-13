export interface WalletTransferPayload {
  receiverId: string;
  amount: number;
  description: string;
}

export type WalletDeductPayload = {
  userId: string;
  amount: number;
  description: string;
};

export type WalletDeductInput = {
  userId?: string;
  receiverId?: string;
  amount: number;
  description: string;
};

export interface WalletTransferReceiver {
  id: string;
  name: string;
  role: string;
  roleLabel: string;
  balance: number;
  email?: string;
  mobile?: string;
}
