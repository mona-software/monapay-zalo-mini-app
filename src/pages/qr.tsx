import React, { FormEvent, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Page } from 'zmp-ui';
import { monaPayApi, QrResult } from '../services/api';
import { loadSettings } from '../services/settings';

export default function QrPage() {
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<QrResult>();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const merchant = loadSettings();
    const amountNumber = Number(amount);
    if (!merchant.ownerNumber || !merchant.merchantId || !merchant.terminalId
      || !merchant.virtualAccountPrefix || !merchant.beneficiaryName) {
      setStatus('Hãy hoàn tất màn Cấu hình trước.');
      return;
    }
    if (!Number.isInteger(amountNumber) || amountNumber <= 0 || amountNumber > 1_000_000_000) {
      setStatus('Số tiền phải là số nguyên từ 1 đến 1.000.000.000 VND.');
      return;
    }

    setLoading(true);
    setStatus('');
    setResult(undefined);
    try {
      const qr = await monaPayApi.createQr({
        ownerNumber: merchant.ownerNumber,
        ownerType: merchant.ownerType,
        merchantId: merchant.merchantId,
        terminalId: merchant.terminalId,
        orderId: orderId.trim(),
        virtualAccountPrefix: merchant.virtualAccountPrefix,
        beneficiaryName: merchant.beneficiaryName,
        amount: amountNumber,
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      setResult(qr);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page className="page">
      <header><p className="eyebrow">MONA Pay</p><h1>Tạo QR thu tiền</h1></header>
      <form className="card form" onSubmit={submit}>
        <label>Mã đơn<input required value={orderId} onChange={(event) => setOrderId(event.target.value)} /></label>
        <label>Số tiền (VND)<input required inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
        <label>Nội dung<input maxLength={255} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <button type="submit" disabled={loading}>{loading ? 'Đang tạo…' : 'Tạo VietQR'}</button>
      </form>
      {status && <p className="message error">{status}</p>}
      {result && (
        <section className="card qr-result" aria-live="polite">
          <QRCodeSVG value={result.qr_data_url} size={220} level="M" />
          <strong>Quét bằng ứng dụng ngân hàng</strong>
          <small>VA: {result.virtual_account_number || 'Theo cấu hình tài khoản'}</small>
        </section>
      )}
    </Page>
  );
}
