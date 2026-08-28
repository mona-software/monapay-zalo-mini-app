import React, { FormEvent, useEffect, useState } from 'react';
import { Page } from 'zmp-ui';
import { monaPayApi } from '../services/api';
import { loadSettings, MerchantSettings, saveSettings } from '../services/settings';

export default function SettingsPage() {
  const [settings, setSettings] = useState<MerchantSettings>(loadSettings());
  const [status, setStatus] = useState('Đang kiểm tra proxy…');

  useEffect(() => {
    void monaPayApi.health()
      .then((health) => setStatus(health.ready ? `Proxy sẵn sàng · ${health.baseUrl}` : 'Proxy còn thiếu biến môi trường.'))
      .catch((error: unknown) => setStatus(error instanceof Error ? error.message : String(error)));
  }, []);

  function update<K extends keyof MerchantSettings>(key: K, value: MerchantSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    saveSettings(settings);
    setStatus('Đã lưu cấu hình merchant trên thiết bị.');
  }

  return (
    <Page className="page">
      <header><p className="eyebrow">Thiết lập</p><h1>Cấu hình nhận tiền</h1></header>
      <p className="message">{status}</p>
      <form className="card form" onSubmit={submit}>
        <label>Số tài khoản ACB<input required value={settings.ownerNumber} onChange={(event) => update('ownerNumber', event.target.value)} /></label>
        <label>Loại chủ tài khoản<select value={settings.ownerType} onChange={(event) => update('ownerType', event.target.value as 'PER' | 'ORG')}><option value="ORG">Tổ chức</option><option value="PER">Cá nhân</option></select></label>
        <label>Merchant ID<input required value={settings.merchantId} onChange={(event) => update('merchantId', event.target.value)} /></label>
        <label>Terminal ID<input required value={settings.terminalId} onChange={(event) => update('terminalId', event.target.value)} /></label>
        <label>Đầu số VA<input required maxLength={10} value={settings.virtualAccountPrefix} onChange={(event) => update('virtualAccountPrefix', event.target.value)} /></label>
        <label>Tên người thụ hưởng<input required value={settings.beneficiaryName} onChange={(event) => update('beneficiaryName', event.target.value)} /></label>
        <label>Số VA để xem giao dịch<input value={settings.virtualAccountNumber} onChange={(event) => update('virtualAccountNumber', event.target.value)} /></label>
        <button type="submit">Lưu cấu hình</button>
      </form>
      <p className="security-note">Username, password và client secret không nằm trong Mini App; các giá trị đó chỉ được đặt ở backend proxy.</p>
    </Page>
  );
}
