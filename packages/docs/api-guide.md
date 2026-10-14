# Hướng dẫn dùng API StayReco (cho FE web và mobile)

> **Bản nháp.** Mục **Hiện tại** mô tả đúng hành vi của backend lúc này. Mục **Đề xuất** `TODO(họp)` là thứ sẽ đổi sau khi team chốt; FE đừng code theo phần đó cho đến khi tài liệu cập nhật.
> Quy ước đặt URL: xem [CONVENTIONS.md](../../backend/docs/CONVENTIONS.md#1-đặt-tên-url-api).
> File này giữ **quy tắc chung** cho mọi API. Endpoint cụ thể của từng phase nằm trong [contracts/](./contracts/), trạng thái phase xem [README.md](./README.md).

## 1. Thông tin chung

| | |
|---|---|
| Base URL (dev) | `http://localhost:3000/api/v1` |
| Base URL (staging) | `TODO(họp)` |
| Health check | `GET /health` trả `{ "status": "ok" }` |
| Định dạng | JSON, `Content-Type: application/json` |
| CORS (dev) | Cho phép `http://localhost:3001` (biến `CORS_ORIGINS`), có gửi kèm cookie |
| ID | UUID dạng chuỗi |
| Tên field | camelCase |

FE web: đặt `NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1`.

## 2. Xác thực

### 2.1 Token

- **Access token**: JWT, sống **15 phút** (`expiresIn` tính bằng giây). Gửi kèm mọi request cần đăng nhập:
  `Authorization: Bearer <accessToken>`
- **Refresh token**: chuỗi ngẫu nhiên, sống 30 ngày, **đổi mới sau mỗi lần refresh**. Dùng lại refresh token cũ thì cả phiên bị thu hồi và người dùng phải đăng nhập lại.
- Sau khi logout hoặc tài khoản bị khóa, access token **bị từ chối ngay**, không cần chờ hết 15 phút.

### 2.2 Web và mobile khác nhau ở đâu

| | Web (Next.js) | Mobile (Expo) |
|---|---|---|
| Header bắt buộc | `X-Client-Type: web` cho các API login, register, refresh, accept invitation | Không gửi header này |
| Nhận refresh token | Trong **cookie httpOnly** `refresh_token` (path `/api/v1/auth`). JS không đọc được cookie này, như vậy là đúng. | Trong **body** (`refreshToken`). Lưu bằng `expo-secure-store`, không dùng AsyncStorage. |
| Gọi refresh | `POST /auth/refresh` với body rỗng `{}`, axios cần `withCredentials: true` | `POST /auth/refresh` với body `{ "refreshToken": "..." }` |
| Lưu access token | Trong bộ nhớ (Zustand), **không** lưu localStorage | Trong bộ nhớ, hoặc secure-store nếu cần |

### 2.3 Luồng đề xuất cho client

1. Login thành công: lưu `accessToken`, `account`, và với mobile thì lưu thêm `refreshToken`.
2. Gọi API kèm `Authorization`.
3. Nhận **401 với `code: "UNAUTHENTICATED"`**: gọi `/auth/refresh` **một lần** (gom các request đang chờ lại, không refresh song song), rồi gửi lại request gốc. Các lỗi 401 khác không refresh (xem mục 4.3).
4. Refresh cũng trả 401: xóa trạng thái đăng nhập và chuyển về `/login?next=...`.

### 2.4 Các endpoint auth

Danh sách endpoint, body, response (`AuthResult`, `Account`) nằm trong contract [phase 0](./contracts/phase-0-foundation.md#endpoint).

### 2.5 Các trang FE mà link trong email trỏ tới

Backend gửi email chứa link `WEB_APP_URL/<path>?token=...`. FE cần có 3 trang sau, mỗi trang đọc `token` trên URL rồi gọi API tương ứng:

| Trang FE | Gọi API |
|---|---|
| `/verify-email?token=` | `POST /auth/verify-email` |
| `/reset-password?token=` | Form mật khẩu mới, rồi `POST /auth/reset-password` |
| `/accept-invitation?token=` | Form đặt mật khẩu, rồi `POST /auth/invitations/accept` |

### 2.6 Role

| Backend (`role`) | FE route prefix |
|---|---|
| `CUSTOMER` | `/account` |
| `HOTEL_PARTNER` | `/partner` |
| `HOTEL_STAFF` | `/staff` |
| `PLATFORM_MANAGER` | `/manager` |
| `ADMIN` | `/admin` |

Kiểm tra quyền ở FE chỉ để điều hướng giao diện. Backend luôn kiểm tra lại quyền. Giá trị role lấy từ `Role` trong `@stayreco/shared`, không gõ chuỗi tay.

## 3. Quy tắc dữ liệu

- **Validate form**: dùng đúng schema backend dùng, import từ `@stayreco/shared` (ví dụ `loginSchema`, `registerCustomerSchema`). Không tự viết lại luật ở FE.
- **Mật khẩu**: 8–128 ký tự, có ít nhất 1 chữ cái và 1 chữ số (`passwordSchema`, MSG08).
- **Email**: backend tự trim và chuyển về chữ thường.
- **Field lạ** trong body bị trả **400**. Chỉ gửi đúng các field trong bảng trên. Ví dụ form đăng ký hiện **không** nhận `phone`.
- **Ngày giờ**: API nhận và trả chuỗi ISO 8601 theo UTC (`2026-10-14T03:00:00.000Z`). FE tự hiển thị theo `Asia/Ho_Chi_Minh`, dạng `dd/mm/yyyy`. Ngày không có giờ (check-in, check-out) dùng `YYYY-MM-DD`.
- **Tiền**: `TODO(họp)`, đề xuất số nguyên VND (không có phần thập phân), FE tự định dạng `2.250.000 ₫`.

## 4. Format response (đã chốt)

Kiểu TypeScript nằm trong `@stayreco/shared` (`APIResponse`, `APIError`, `PageMeta`), backend và FE cùng import. Mọi endpoint đều trả theo dạng này, trừ response **204** (không có body).

### 4.1 Thành công

```jsonc
// Một đối tượng
{ "success": true, "message": "OK", "data": { ... } }

// Danh sách có phân trang
{
  "success": true,
  "message": "OK",
  "data": [ ... ],
  "meta": { "page": 1, "pageSize": 10, "total": 57, "totalPages": 6 }
}
```

Cột **Response** trong các bảng endpoint (mục 2.4) mô tả nội dung của `data`.

Type (định nghĩa trong `packages/shared/src/http.ts`):

```ts
export interface APIResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface APIError {
  success: false;
  message: string;
  code: ErrorCode | string;
  details?: { field: string; message: string }[];
}
```

Trường `status` trong body không dùng, vì HTTP status đã có ở `error.response.status`.

### 4.2 Lỗi

```jsonc
// Lỗi nghiệp vụ
{ "success": false, "message": "Invalid email or password", "code": "AUTH_INVALID_CREDENTIALS" }

// Lỗi validate (400): details liệt kê từng field, field lồng nhau viết dạng "a.b"
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "email", "message": "Invalid email address" },
    { "field": "password", "message": "Too small: expected string to have >=8 characters" }
  ]
}
```

- **FE quyết định logic theo `code`**, không theo `message`. `message` là tiếng Anh dành cho dev và log, có thể đổi câu chữ bất cứ lúc nào.
- `code` đã công bố thì không đổi tên. Khi cần mã mới, backend thêm mới và cập nhật bảng dưới đây.
- Lỗi không có mã riêng thì nhận mã chung theo HTTP status.
- Danh sách mã có sẵn dưới dạng hằng `ErrorCode` trong `@stayreco/shared`: so sánh `err.code === ErrorCode.UNAUTHENTICATED`, không gõ chuỗi.

### 4.3 Bảng mã lỗi

| `code` | HTTP | Khi nào | Gợi ý FE (SRS) |
|---|---|---|---|
| `VALIDATION_ERROR` | 400 | Body hoặc query không hợp lệ, có field lạ | Hiện `details` dưới từng ô (MSG02–MSG04, MSG08) |
| `BAD_REQUEST` | 400 | Lỗi 400 khác | Thông báo chung |
| `UNAUTHENTICATED` | 401 | Thiếu access token, token sai hoặc hết hạn, phiên đã bị thu hồi | **Gọi refresh** (mục 2.3) |
| `FORBIDDEN` | 403 | Đăng nhập rồi nhưng không đủ quyền | MSG25 |
| `NOT_FOUND` | 404 | Không tìm thấy tài nguyên hoặc route | Trang 404 |
| `CONFLICT` | 409 | Xung đột dữ liệu khác | Thông báo chung |
| `TOO_MANY_REQUESTS` | 429 | Gọi quá nhanh (login 5 lần/phút, email 3 lần/15 phút) | "Vui lòng thử lại sau" |
| `INTERNAL_ERROR` | 500 | Lỗi hệ thống | Thông báo chung, không hiện chi tiết |
| `AUTH_INVALID_CREDENTIALS` | 401 | Sai email hoặc mật khẩu (kể cả email không tồn tại) | MSG05. **Không** gọi refresh. |
| `AUTH_ACCOUNT_LOCKED` | 403 | Sai mật khẩu 5 lần, bị khóa 15 phút | "Bạn đã nhập sai quá nhiều lần…" |
| `AUTH_ACCOUNT_SUSPENDED` | 403 | Tài khoản bị đình chỉ | MSG06 |
| `AUTH_ACCOUNT_INACTIVE` | 403 | Đặt lại mật khẩu cho tài khoản không hoạt động | MSG06 |
| `AUTH_EMAIL_TAKEN` | 409 | Email đã được đăng ký | MSG07 dưới ô email |
| `AUTH_WRONG_PASSWORD` | 401 | Đổi mật khẩu nhưng nhập sai mật khẩu hiện tại | Lỗi dưới ô mật khẩu hiện tại. **Không** gọi refresh. |
| `AUTH_TOKEN_INVALID` | 400 | Link xác thực email, đặt lại mật khẩu hoặc lời mời không hợp lệ, hết hạn, đã dùng | "Liên kết không hợp lệ hoặc đã hết hạn" |
| `AUTH_REFRESH_TOKEN_INVALID` | 401 | Refresh token thiếu, sai, hết hạn hoặc bị dùng lại | Xóa trạng thái đăng nhập, chuyển về `/login` |
| `AUTH_INVITATION_ACCEPTED` | 409 | Lời mời đã được chấp nhận | Chuyển sang đăng nhập |
| `AUTH_SESSION_NOT_FOUND` | 404 | Thu hồi phiên không tồn tại | Tải lại danh sách phiên |

Lưu ý quan trọng: **chỉ gọi refresh khi `status === 401` và `code === 'UNAUTHENTICATED'`.** Các lỗi 401 khác (`AUTH_INVALID_CREDENTIALS`, `AUTH_WRONG_PASSWORD`, `AUTH_REFRESH_TOKEN_INVALID`) mà cũng refresh thì sẽ bị lặp vô hạn hoặc đăng xuất nhầm.

## 5. Danh sách, phân trang, lọc, sắp xếp

Dạng `meta` ở mục 4.1 đã chốt. Tên tham số query bên dưới vẫn là **đề xuất** `TODO(họp)`, sẽ chốt khi làm API danh sách đầu tiên:

| Tham số | Ví dụ | Mặc định |
|---|---|---|
| `page` | `?page=2` | 1 |
| `pageSize` | `?pageSize=20` | 10 (theo SRS 5.2), tối đa 100 |
| `sort` | `?sort=-createdAt` (dấu `-` là giảm dần) | tùy tài nguyên |
| `q` | `?q=riverside` (tìm kiếm tự do) | |
| filter | `?status=pending&fromDate=2026-10-01` | |

## 6. Tài liệu API tự sinh (Swagger)

- Swagger UI: `http://localhost:3000/api/docs`. Spec OpenAPI dạng JSON: `http://localhost:3000/api/docs-json` (dùng để import vào Postman hoặc sinh type cho FE).
- Chỉ bật khi `NODE_ENV !== 'production'`.
- Thử endpoint cần đăng nhập: gọi `/auth/login`, copy `accessToken`, bấm **Authorize** rồi dán vào. Swagger nhớ token qua các lần tải lại trang.
- Swagger phản ánh code **đang chạy**; contract trong `contracts/` là **thỏa thuận** giữa BE và FE (có thể đi trước code). Khi lệch nhau thì sửa cho khớp contract hoặc cập nhật contract.
- Response body hiện **chưa có schema** trong Swagger, sẽ bổ sung sau khi chốt format response (mục 4.2).
