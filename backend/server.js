'use strict';

const http = require('node:http');

const PORT = Number(process.env.PORT || 8787);
const BASE_URL = String(process.env.MONAPAY_BASE_URL || 'https://api.monapay.vn').replace(/\/+$/, '');
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
const MAX_BODY_BYTES = 1024 * 1024;
let tokenState = { accessToken: '', expiresAt: 0 };

class ApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

function send(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function configureCors(request, response) {
  const origin = String(request.headers.origin || '');
  const accepted = ALLOWED_ORIGIN === '*' || !origin || origin === ALLOWED_ORIGIN;
  if (accepted && origin) {
    response.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN === '*' ? '*' : origin);
    response.setHeader('Vary', 'Origin');
  }
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  return accepted;
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new ApiError('Request body vượt quá 1 MB.', 413);
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ApiError('Request body phải là JSON hợp lệ.', 400);
  }
}

function requireCredentials(write = false) {
  if (!process.env.MONAPAY_USERNAME || !process.env.MONAPAY_PASSWORD) {
    throw new ApiError('Backend chưa cấu hình MONAPAY_USERNAME/MONAPAY_PASSWORD.', 503);
  }
  if (write && !process.env.MONAPAY_CLIENT_SECRET) {
    throw new ApiError('Backend chưa cấu hình MONAPAY_CLIENT_SECRET.', 503);
  }
}

async function fetchJson(url, init) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    let json;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      throw new ApiError(`MONA Pay trả response không phải JSON (HTTP ${response.status}).`, 502);
    }
    if (!response.ok || json.success === false) {
      const detail = typeof json.detail === 'string' ? json.detail : undefined;
      throw new ApiError(json.message || detail || `MONA Pay API lỗi HTTP ${response.status}.`, response.status);
    }
    return json.data;
  } finally {
    clearTimeout(timer);
  }
}

async function login(force = false) {
  requireCredentials(false);
  if (!force && tokenState.accessToken && Date.now() < tokenState.expiresAt) return tokenState.accessToken;
  const data = await fetchJson(`${BASE_URL}/api/v1/client/login`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.MONAPAY_USERNAME,
      password: process.env.MONAPAY_PASSWORD,
    }),
  });
  if (!data?.access_token) throw new ApiError('Response đăng nhập không có access_token.', 502);
  const lifetimeSeconds = Math.min(Number(data.expires_in || 86400), 86400);
  tokenState = {
    accessToken: data.access_token,
    expiresAt: Date.now() + Math.max(lifetimeSeconds - 60, 60) * 1000,
  };
  return tokenState.accessToken;
}

async function monaPayRequest(method, path, { body, query } = {}, retried = false) {
  const write = method !== 'GET';
  requireCredentials(write);
  const token = await login(retried);
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }
  const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` };
  if (write) {
    headers['Content-Type'] = 'application/json';
    headers['X-Client-Secret'] = process.env.MONAPAY_CLIENT_SECRET;
  }
  try {
    return await fetchJson(url, {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch (error) {
    if (!retried && error instanceof ApiError && error.status === 401) {
      tokenState = { accessToken: '', expiresAt: 0 };
      return monaPayRequest(method, path, { body, query }, true);
    }
    throw error;
  }
}

function qrBody(input) {
  const required = ['ownerNumber', 'ownerType', 'merchantId', 'terminalId', 'orderId', 'virtualAccountPrefix', 'beneficiaryName'];
  for (const key of required) {
    if (!input[key] || typeof input[key] !== 'string') throw new ApiError(`Thiếu trường ${key}.`, 422);
  }
  const amount = Number(input.amount);
  if (!Number.isInteger(amount) || amount <= 0 || amount > 1000000000) {
    throw new ApiError('amount phải là số nguyên từ 1 đến 1.000.000.000.', 422);
  }
  if (!['PER', 'ORG'].includes(input.ownerType)) throw new ApiError('ownerType phải là PER hoặc ORG.', 422);
  if (input.virtualAccountPrefix.length > 10) throw new ApiError('virtualAccountPrefix tối đa 10 ký tự.', 422);
  return {
    ownerNumber: input.ownerNumber,
    ownerType: input.ownerType,
    merchantId: input.merchantId,
    terminalId: input.terminalId,
    orderId: input.orderId,
    virtualAccountPrefix: input.virtualAccountPrefix,
    beneficiaryName: input.beneficiaryName,
    amount,
    ...(input.description ? { description: String(input.description).slice(0, 255) } : {}),
  };
}

async function handle(request, response) {
  if (!configureCors(request, response)) {
    send(response, 403, { success: false, message: 'Origin không được phép.' });
    return;
  }
  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url || '/', 'http://localhost');
  if (request.method === 'GET' && url.pathname === '/health') {
    send(response, 200, {
      success: true,
      data: {
        ready: Boolean(process.env.MONAPAY_USERNAME && process.env.MONAPAY_PASSWORD && process.env.MONAPAY_CLIENT_SECRET),
        baseUrl: BASE_URL,
      },
    });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/qr') {
    const input = await readJson(request);
    const data = await monaPayRequest('POST', '/api/v1/acb/qr-payment/generate', { body: qrBody(input) });
    send(response, 200, { success: true, data });
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/transactions') {
    const virtualAccountNumber = url.searchParams.get('virtual_account_number') || '';
    if (!virtualAccountNumber) throw new ApiError('Thiếu virtual_account_number.', 422);
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 50)));
    if (!Number.isInteger(page) || !Number.isInteger(limit)) throw new ApiError('page/limit phải là số nguyên.', 422);
    const data = await monaPayRequest('GET', '/api/v1/acb/virtual-account/transactions', {
      query: { virtual_account_number: virtualAccountNumber, page, limit },
    });
    send(response, 200, { success: true, data });
    return;
  }
  send(response, 404, { success: false, message: 'Không tìm thấy endpoint.' });
}

function createServer() {
  return http.createServer((request, response) => {
    Promise.resolve(handle(request, response)).catch((error) => {
      const status = error instanceof ApiError ? error.status : 500;
      const message = error instanceof Error ? error.message : 'Lỗi không xác định.';
      if (!response.headersSent) send(response, status, { success: false, message });
      else response.end();
    });
  });
}

if (require.main === module) {
  createServer().listen(PORT, '0.0.0.0', () => {
    console.log(`MONA Pay proxy đang nghe port ${PORT}; API ${BASE_URL}.`);
  });
}

module.exports = { createServer };
