# Chạy StayReco ở máy

Dành cho FE web, mobile và người mới: chạy backend ở máy để nối API.

## Cần cài sẵn (một lần)

- **Node.js 20.19 trở lên** (hoặc 22). Kiểm tra: `node -v`. Prisma 7 không chạy trên Node cũ hơn.
- **Docker Desktop**, phải đang chạy (database PostgreSQL chạy trong Docker).
- Đã clone repo `stay-reco` và ở nhánh `develop`.

## Backend: lần đầu tiên

Mở terminal ở thư mục `stay-reco/backend`:

```bash
cp .env.example .env
```

Mở `backend/.env` và sửa 2 chỗ:

1. `JWT_ACCESS_SECRET=`: chuỗi bất kỳ dài ít nhất 32 ký tự.
2. `BENEFICIARY_ENCRYPTION_KEY=`: **bắt buộc**, thiếu thì backend không chạy. Tạo bằng lệnh:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

   Dán chuỗi in ra vào sau dấu `=`.

Các biến khác giữ nguyên. Để trống `CLOUDINARY_*` thì chỉ các API tải ảnh và giấy tờ báo `503 UPLOAD_UNAVAILABLE`, mọi API khác vẫn dùng được. Cần thử tải file thật thì xin BE thông tin Cloudinary.

Rồi chạy lần lượt:

```bash
npm install          # cài thư viện, tự build packages/shared và Prisma client
npm run db:up        # bật PostgreSQL trong Docker
npm run db:migrate   # tạo bảng
npm run db:seed      # dữ liệu mẫu: tiện ích, loại giường, admin, khách sạn demo
npm run dev          # chạy backend
```

Backend chạy ở **http://localhost:3000/api/v1**, xem và thử API ở **http://localhost:3000/api/docs** (Swagger: bấm Authorize, dán access token lấy từ `POST /auth/login`).

## Backend: mỗi lần pull code mới

Trong `stay-reco/backend`:

```bash
git pull
npm install
npm run db:up        # bỏ qua nếu database đang chạy
npm run db:migrate   # áp thay đổi database mới (nếu có)
npm run db:seed      # chạy lại an toàn, không tạo trùng
npm run dev
```

## Frontend chạy cùng lúc

Chạy backend trước, rồi chạy frontend ở **cổng 3001** (backend dùng cổng 3000 và chỉ cho phép CORS từ `localhost:3001`):

```bash
cd frontend
npm install
npm run dev -- -p 3001
```

- Mở web ở **http://localhost:3001**. FE mặc định gọi API ở `http://localhost:3000/api/v1` (`frontend/src/lib/axios.ts`); muốn đổi thì đặt `NEXT_PUBLIC_API_URL` trong `frontend/.env.local`.
- Các link trong email (xác thực, đặt lại mật khẩu, lời mời) trỏ về `http://localhost:3001`. Ở máy, email không gửi thật mà **in ra terminal của backend**, nên lấy mã OTP và link ở đó.

## Tài khoản demo

Mật khẩu chung `Demo@123456` (đổi bằng `SEED_DEMO_PASSWORD`).

| Email | Vai trò | Có sẵn |
|---|---|---|
| `partner.danang@stayreco.local` | Đối tác | 2 khách sạn: Sơn Trà Bay Resort & Spa (đang hoạt động, 3 loại phòng, 12 phòng), Mỹ Khê Boutique Hotel (đang chờ duyệt) |
| `partner.hanoi@stayreco.local` | Đối tác | Hồ Gươm Heritage Hotel (đang hoạt động) |
| `partner.hcm@stayreco.local` | Đối tác | Sài Gòn Riverside Grand Hotel (đang hoạt động) |
| `staff.danang@stayreco.local`, `staff.hanoi@stayreco.local`, `staff.hcm@stayreco.local` | Nhân viên (Lễ tân, Đặt phòng) | Khách sạn đang hoạt động của thành phố đó |
| `pm@stayreco.local` | Quản lý nền tảng | Hàng đợi có 1 hồ sơ chờ duyệt (Mỹ Khê) |
| `admin@stayreco.local` | Admin | Mật khẩu là `SEED_ADMIN_PASSWORD` trong `.env` (mặc định `Admin@123456`) |

Tên khách sạn và pháp nhân là hư cấu; ảnh lấy từ picsum.photos; giấy tờ của dữ liệu demo không có file thật trên Cloudinary (link xem file sẽ báo không tìm thấy).

## Lỗi hay gặp

| Lỗi | Cách xử lý |
|---|---|
| `P1001: Can't reach database server at localhost:5432` | Docker Desktop chưa bật, hoặc chưa chạy `npm run db:up` |
| `Invalid environment variables ... BENEFICIARY_ENCRYPTION_KEY` | Chưa thêm khóa, hoặc khóa sai định dạng; tạo lại bằng lệnh ở trên |
| `Port 3000 is already in use` | Đang có app khác (thường là frontend) chiếm cổng 3000: tắt nó, chạy backend trước, frontend chạy cổng 3001 |
| Trình duyệt báo lỗi **CORS** | Frontend không chạy ở `localhost:3001`; chạy lại bằng `npm run dev -- -p 3001` |
| `npm run db:migrate` hỏi có muốn **reset** database không | Chọn **No** và báo BE. Chỉ khi chấp nhận mất hết dữ liệu ở máy mình mới chạy `npx prisma migrate reset` (tự tạo lại bảng và dữ liệu mẫu) |
| Gọi API báo `401 UNAUTHENTICATED` | Access token hết hạn (15 phút): axios tự refresh; nếu vẫn lỗi thì đăng nhập lại |

## Tiếp theo

- Quy tắc gọi API (token, envelope, mã lỗi, phân trang): [api-guide.md](./api-guide.md).
- Endpoint theo màn hình bạn làm: [api/](./api/README.md).
