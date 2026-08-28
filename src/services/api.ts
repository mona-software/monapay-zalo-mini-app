export type Transaction = {
  id?: string;
  transaction_code?: string;
  amount?: number;
  transaction_content?: string;
  description?: string;
  transaction_date?: string;
  transfer_date?: string;
  account_number?: string;
};

export type QrResult = {
  id?: string;
  qr_data_url: string;
  virtual_account_number?: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

declare global {
  interface Window {
    MONAPAY_PROXY_URL?: string;
  }
}

const baseUrl = () => (window.MONAPAY_PROXY_URL || 'http://localhost:8787').replace(/\/+$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  const envelope = await response.json() as ApiEnvelope<T>;
  if (!response.ok || envelope.success === false) {
    throw new Error(envelope.message || `Proxy MONA Pay lỗi HTTP ${response.status}.`);
  }
  return envelope.data;
}

export const monaPayApi = {
  createQr: (body: Record<string, unknown>) => request<QrResult>('/api/qr', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  transactions: (virtualAccountNumber: string) => request<{ data: Transaction[] }>(
    `/api/transactions?virtual_account_number=${encodeURIComponent(virtualAccountNumber)}&page=1&limit=50`,
  ),
  health: () => request<{ ready: boolean; baseUrl: string }>('/health'),
};
