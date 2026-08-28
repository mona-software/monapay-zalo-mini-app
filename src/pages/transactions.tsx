import React, { FormEvent, useState } from 'react';
import { Page } from 'zmp-ui';
import { monaPayApi, Transaction } from '../services/api';
import { loadSettings } from '../services/settings';

function transactionDate(transaction: Transaction): string {
  return transaction.transaction_date || transaction.transfer_date || '';
}

export default function TransactionsPage() {
  const [virtualAccountNumber, setVirtualAccountNumber] = useState(loadSettings().virtualAccountNumber);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function load(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setStatus('');
    try {
      const result = await monaPayApi.transactions(virtualAccountNumber.trim());
      setTransactions(Array.isArray(result.data) ? result.data : []);
      if (!result.data?.length) setStatus('VA này chưa có giao dịch.');
    } catch (error) {
      setTransactions([]);
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page className="page">
      <header><p className="eyebrow">Đối soát</p><h1>Giao dịch gần nhất</h1></header>
      <form className="card inline-form" onSubmit={load}>
        <label>Số VA<input required value={virtualAccountNumber} onChange={(event) => setVirtualAccountNumber(event.target.value)} /></label>
        <button type="submit" disabled={loading}>{loading ? 'Đang tải…' : 'Làm mới'}</button>
      </form>
      {status && <p className="message">{status}</p>}
      <section className="transaction-list">
        {transactions.map((transaction) => (
          <article className="card transaction" key={transaction.transaction_code || transaction.id}>
            <div><strong>{Number(transaction.amount || 0).toLocaleString('vi-VN')} đ</strong><small>{transactionDate(transaction)}</small></div>
            <p>{transaction.transaction_content || transaction.description || 'Không có nội dung'}</p>
            <code>{transaction.transaction_code || transaction.id}</code>
          </article>
        ))}
      </section>
    </Page>
  );
}
