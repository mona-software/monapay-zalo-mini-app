# MONA Pay Zalo Mini App

Scaffold ZMP + React có ba màn:

1. **Tạo QR thu tiền**: nhập mã đơn, số tiền, nội dung; backend tạo QR và app render VietQR.
2. **Giao dịch**: lấy 50 giao dịch gần nhất theo số VA.
3. **Cấu hình**: lưu thông tin merchant/VA không nhạy cảm trên thiết bị và kiểm tra trạng thái proxy.

Username, password, Bearer token và `X-Client-Secret` không bao giờ đi vào bundle Mini App. `backend/server.js` là proxy Node.js 18+ zero-dependency, tự login/cache token và chỉ cho phép origin đã cấu hình.

## Điều kiện từ Mon

Mon cần có tài khoản **Zalo Developers**, tạo Mini App tại cổng Zalo Developers, lấy App ID và hoàn tất các bước xét duyệt/quyền cần thiết. Scaffold không thể tự đăng ký hoặc publish thay tài khoản doanh nghiệp.

## Chạy local

Không có package nào được cài sẵn trong scaffold. Khi chuẩn bị trên máy có package cache/mạng phù hợp:

```bash
cd devtools/zalo-mini-app
npm install
cp backend/.env.example backend/.env
```

`backend/server.js` đọc biến môi trường trực tiếp; Node không tự nạp file `.env`. Export các biến hoặc dùng secret manager của nền tảng chạy backend:

```bash
export MONAPAY_USERNAME='...'
export MONAPAY_PASSWORD='...'
export MONAPAY_CLIENT_SECRET='...'
export ALLOWED_ORIGIN='http://localhost:3000'
npm run backend
```

Sau đó chạy `npm start`. Local mặc định gọi `http://localhost:8787`. Khi build thật, inject trước khi app mount:

```html
<script>window.MONAPAY_PROXY_URL = 'https://proxy.example.com';</script>
```

Backend production phải dùng HTTPS và `ALLOWED_ORIGIN` chính xác, không để `*`. CORS không thay thế xác thực: trước khi public, Mon cần đặt proxy sau lớp xác thực/rate-limit của hạ tầng hoặc bổ sung bước kiểm access token Zalo theo cấu hình Mini App đã duyệt. Chỉ lưu credential trong secret manager, không commit `.env`.

## Deploy

1. Deploy backend proxy lên hạ tầng của MONA, cấu hình năm biến trong `backend/.env.example`.
2. Điền URL HTTPS proxy vào bootstrap của Mini App.
3. Chạy `npm run build`, kiểm tra trên Zalo Mini App Simulator và thiết bị thật.
4. Mon đăng nhập Zalo Developers, khai báo domain/quyền, nộp phiên bản để xét duyệt rồi publish.

Không dùng tài khoản test production để tạo QR thật trong lúc smoke test. Tài liệu: https://monapay.vn/docs · llms: https://monapay.vn/llms.txt · Hotline 1900 636 648 · info@themona.global

**MONA Pay thuộc bộ MONA Cloud của The MONA Group.**
