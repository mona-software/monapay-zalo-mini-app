export type MerchantSettings = {
  ownerNumber: string;
  ownerType: 'PER' | 'ORG';
  merchantId: string;
  terminalId: string;
  virtualAccountPrefix: string;
  beneficiaryName: string;
  virtualAccountNumber: string;
};

const STORAGE_KEY = 'monapay.merchantSettings';

export const emptySettings: MerchantSettings = {
  ownerNumber: '',
  ownerType: 'ORG',
  merchantId: '',
  terminalId: '',
  virtualAccountPrefix: '',
  beneficiaryName: '',
  virtualAccountNumber: '',
};

export function loadSettings(): MerchantSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...emptySettings, ...JSON.parse(stored) } : emptySettings;
  } catch {
    return emptySettings;
  }
}

export function saveSettings(settings: MerchantSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
