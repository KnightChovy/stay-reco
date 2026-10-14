# Quy ước Backend StayReco

> **Bản nháp.** Các mục có `TODO(họp)` sẽ được chốt trong buổi họp team. Sau khi chốt, cả team cùng tuân theo tài liệu này.
> Áp dụng cho `backend/` (NestJS 11 + Prisma + PostgreSQL). Hướng dẫn dùng API cho FE/mobile nằm ở [api-guide.md](../../packages/docs/api-guide.md). Phase và contract: [packages/docs](../../packages/docs/README.md).

## 1. Đặt tên URL API

Mục tiêu: chỉ cần nhìn URL là biết endpoint thuộc tài nguyên nào, và mọi endpoint đều đặt tên theo **cùng một cách**. Không được mỗi module một kiểu, nửa đặt theo role nửa đặt theo feature.

### 1.1 Chọn một cách tổ chức URL cho toàn bộ hệ thống

`TODO(họp)`: chốt **một** trong hai cách. Đề xuất chọn **cách A**.

| | **A. Theo tài nguyên/feature (đề xuất)** | B. Theo role |
|---|---|---|
| Ví dụ | `GET /bookings/:id`, `GET /hotels/:hotelId/rooms` | `GET /staff/bookings/:id`, `GET /partner/rooms` |
| Phân quyền | Bằng `@Roles()` và kiểm tra tenant trong service | Bằng prefix URL và `@Roles()` |
| Tài nguyên dùng chung giữa nhiều role | **Một** endpoint. Ví dụ đơn đặt phòng được khách hàng, nhân viên, đối tác và quản lý nền tảng cùng xem, mỗi role thấy phạm vi dữ liệu của mình. | Phải nhân bản: `/customer/bookings`, `/staff/bookings`, `/partner/bookings`, `/manager/bookings` |
| Khi phân quyền thay đổi (ví dụ cho đối tác xem thêm đơn đặt) | Chỉ sửa `@Roles()` | Phải thêm URL mới, FE đổi theo |
| Khớp với code hiện có | Đã đúng: `/auth/...` | Phải đổi toàn bộ |

Lý do đề xuất cách A: StayReco có 6 role dùng chung nhiều tài nguyên (đơn đặt, khách sạn, hoàn tiền, nội dung marketing). Chia theo role sẽ làm số endpoint tăng theo cấp số nhân và logic bị lặp lại.

> Phần còn lại của mục 1 viết theo cách A. Nếu họp chọn cách B thì viết lại toàn bộ mục 1, **không** trộn hai cách.

### 1.2 Quy tắc chung

1. Mọi API đều có prefix `/api/v1` (đã cấu hình trong `app.setup.ts`). Khi đổi API theo kiểu phá vỡ tương thích thì tăng lên `v2`, không sửa ngầm.
2. Path dùng **danh từ số nhiều, chữ thường, kebab-case**: `/room-types`, `/pricing-rules`, `/verification-requests`.
   Không viết `/roomType`, `/room_types` hay `/getRooms`.
3. Không đặt động từ trong path cho các thao tác CRUD. Method HTTP đã thể hiện hành động:

   | Hành động | Method + Path |
   |---|---|
   | Danh sách | `GET /room-types` |
   | Chi tiết | `GET /room-types/:id` |
   | Tạo | `POST /room-types` |
   | Cập nhật một phần | `PATCH /room-types/:id` |
   | Xóa (xóa mềm hoặc vô hiệu hóa) | `DELETE /room-types/:id` |

   Dùng `PATCH` cho mọi thao tác cập nhật. Chỉ dùng `PUT` khi thay thế toàn bộ, mặc định không dùng.
4. **Hành động nghiệp vụ** không phải CRUD (chuyển trạng thái) thì dùng `POST /<tài-nguyên>/:id/<động-từ>`, động từ viết kebab-case:
   `POST /bookings/:id/confirm`, `POST /bookings/:id/cancel`, `POST /bookings/:id/check-in`, `POST /refund-requests/:id/approve`, `POST /verification-requests/:id/request-changes`.
5. Lồng tối đa **một cấp** khi tài nguyên con chỉ có nghĩa bên trong cha: `/hotels/:hotelId/room-types`.
   Khi đã có id của tài nguyên con thì truy cập phẳng: dùng `GET /room-types/:id`, không dùng `/hotels/:hotelId/room-types/:id`.
6. Tham số path là `:id` (UUID), hoặc `:<tài-nguyên>Id` khi có nhiều id: `:hotelId`.
7. Query string viết camelCase: `?checkIn=2026-10-20&guests=2&page=1&pageSize=10&sort=-createdAt`.
8. Body và response JSON viết **camelCase**. Cột trong DB viết snake_case và map bằng `@map` trong Prisma, như schema hiện tại.

### 1.3 Ba nhóm phạm vi dữ liệu

| Nhóm | Dạng URL | Dùng khi | Ví dụ |
|---|---|---|---|
| Của chính người gọi | `/me/...` | Dữ liệu thuộc về tài khoản đang đăng nhập, không cần truyền id | `GET /me/bookings`, `GET /me/notifications`, `PATCH /me/profile`, `GET /me/loyalty-accounts` |
| Theo khách sạn (tenant) | `/hotels/:hotelId/...` | Đối tác hoặc nhân viên quản lý dữ liệu của **một** khách sạn | `GET /hotels/:hotelId/bookings`, `POST /hotels/:hotelId/room-types`, `GET /hotels/:hotelId/staff` |
| Toàn nền tảng | `/<tài-nguyên>` | Dữ liệu công khai, hoặc quản trị toàn hệ thống (Quản lý nền tảng, Quản trị viên) | `GET /hotels` (công khai), `GET /verification-requests`, `GET /accounts`, `GET /audit-logs` |

Mọi endpoint dạng `/hotels/:hotelId/...` **bắt buộc** kiểm tra người gọi thuộc khách sạn đó (xem mục 4). Không được tin `hotelId` gửi từ client.

### 1.4 Ánh xạ mẫu theo màn hình trong SRS

| Màn hình (SRS 3.1.2) | Endpoint |
|---|---|
| Kết quả tìm kiếm | `GET /hotels?destination=&checkIn=&checkOut=&guests=` |
| Chi tiết khách sạn | `GET /hotels/:id` |
| Chuyến đi của tôi | `GET /me/bookings?status=upcoming` |
| Hủy đặt phòng | `POST /bookings/:id/cancel` |
| Danh sách đặt phòng (nhân viên) | `GET /hotels/:hotelId/bookings` |
| Nhận phòng | `POST /bookings/:id/check-in` |
| Danh mục phòng (đối tác) | `GET /hotels/:hotelId/room-types`, `GET /hotels/:hotelId/rooms` |
| Hàng đợi duyệt đối tác | `GET /verification-requests?status=pending` |
| Duyệt hồ sơ | `POST /verification-requests/:id/approve` |
| Danh sách tài khoản (admin) | `GET /accounts` |

### 1.5 Nhóm auth hiện có

Nhóm `/auth/...` là một feature riêng nên vẫn đúng cách A. `TODO(họp)`: có nên đổi `/auth/sessions` thành `/me/sessions` cho khớp mục 1.3 không? FE chưa tích hợp nên đổi lúc này không tốn công.

## 2. Cấu trúc code

```
src/
  common/           decorators, guards, filters, interceptors, pipes, errors (ErrorCode), http (kiểu response) dùng chung
  config/           kiểm tra biến môi trường (zod)
  (packages/shared) zod schema, ErrorCode, enum, kiểu response dùng chung với FE/mobile
  prisma/           PrismaService
  modules/<feature>/
    <feature>.module.ts
    <feature>.controller.ts        chỉ nhận request, validate DTO, gọi service
    services/<feature>.service.ts  logic nghiệp vụ, gọi Prisma
    dto/<feature>.dto.ts           DTO bọc zod schema từ @stayreco/shared: `class XDto extends zodDto(xSchema) {}`
```

- Tên thư mục và tên file dùng kebab-case. Tên class dùng PascalCase kèm hậu tố (`BookingService`, `CreateBookingDto`).
- Controller không gọi Prisma trực tiếp và không chứa logic nghiệp vụ.
- Mọi input phải đi qua DTO. Schema viết trong `packages/shared/src/schemas/<feature>.ts` (dùng `z.strictObject` để field lạ bị trả **400**), rồi bọc bằng `zodDto` (`common/pipes/validation.ts`). `ZodValidationPipe` toàn cục sẽ validate và chuẩn hóa (trim, lowercase...) trước khi vào controller. Không viết luật validate riêng ở backend: FE và mobile dùng chung schema đó.
- Response chỉ trả field cần thiết, chọn bằng `select` hoặc hàm map rõ ràng (xem `toAccountResponse`). Không trả nguyên object Prisma, vì có thể lộ `passwordHash` hoặc cột nội bộ.
- Mọi endpoint mặc định cần đăng nhập. Endpoint công khai phải gắn `@Public()`. Giới hạn role bằng `@Roles(...)`.
- **Response**: controller trả **dữ liệu trần**. `ResponseInterceptor` sẽ tự bọc thành `{ success, message, data }`, đừng tự bọc trong controller. Danh sách có phân trang thì trả `Paginated.of(items, { page, pageSize, total })` (`common/http/api-response.ts`). Endpoint không trả gì thì dùng `@HttpCode(204)`.
- **Lỗi**: ném exception có sẵn của NestJS kèm mã cố định, ví dụ `throw new ConflictException({ code: ErrorCode.AUTH_EMAIL_TAKEN, message: 'Email is already registered' })`. Mã mới phải thêm vào `packages/shared/src/errors.ts` **và** bảng 4.3 trong [api-guide.md](../../packages/docs/api-guide.md). Đặt tên `<FEATURE>_<MÔ_TẢ>`, không đổi tên mã đã công bố. `HttpExceptionFilter` lo phần định dạng, lỗi không lường trước sẽ thành 500 `INTERNAL_ERROR` và được ghi log.
- **Swagger**: body schema sinh tự động từ zod schema qua `zodDto` (dùng `z.toJSONSchema`), nên **không** viết `@ApiProperty`. Mô tả field thì thêm `.meta({ description })` trong schema. Mỗi controller gắn `@ApiTags('<feature>')`.
- Thao tác quan trọng (tạo, sửa, phê duyệt, tiền, bảo mật) phải ghi `AuditService.log(...)`. Khi thêm hành động mới thì bổ sung vào enum `AuditAction`.

## 3. Cơ sở dữ liệu và migration

1. Nguồn sự thật duy nhất là `prisma/schema.prisma` cùng `prisma/migrations/`. **Không sửa DB bằng tay.** DBeaver và Prisma Studio chỉ dùng để xem.
2. Mỗi người chạy DB riêng bằng Docker (`npm run db:up`). Không dùng chung một DB khi dev.
3. Quy trình đổi schema:
   1. Pull hoặc rebase nhánh mới nhất **trước khi** sửa schema.
   2. Sửa `schema.prisma`, rồi chạy `npm run db:migrate -- --name <mo_ta_ngan>` (snake_case, ví dụ `add_room_type`).
   3. Commit cả `schema.prisma` lẫn thư mục migration mới trong **cùng** PR.
   4. Không sửa hoặc xóa migration đã merge. Muốn thay đổi thì tạo migration mới.
4. Nếu hai người cùng tạo migration song song thì người merge sau rebase, xóa migration của mình rồi chạy lại `db:migrate`.
5. Đặt tên trong schema: model PascalCase số ít (`RoomType`), field camelCase, bảng và cột snake_case qua `@@map` và `@map`, khóa chính là UUID.
6. Dữ liệu demo đặt trong `prisma/seed.ts`. Seed phải chạy lại được nhiều lần mà không lỗi (dùng `upsert`).
7. `TODO(họp)`: đổi image sang `pgvector/pgvector:pg17` và bật extension `vector` trước khi làm module AI hoặc gợi ý.

## 4. Đa người thuê (tenant)

- Ranh giới tenant là **khách sạn** (`hotel_id`). Mọi bảng thuộc khách sạn đều có cột `hotel_id`.
- Mọi truy vấn dữ liệu thuộc khách sạn đều phải lọc theo `hotelId`. `hotelId` lấy từ quan hệ của người gọi (đối tác sở hữu khách sạn, hoặc nhân viên được gán khách sạn), **không lấy từ client**. Giá trị trên URL chỉ dùng để chọn, sau đó phải đối chiếu.
- `TODO(họp)`: viết helper hoặc guard dùng chung, ví dụ `HotelAccessGuard`, để kiểm tra quyền vào `:hotelId`, tránh mỗi service tự kiểm tra một kiểu.
- Mỗi module có dữ liệu tenant phải có e2e test chứng minh đối tác A **không** đọc hoặc sửa được dữ liệu của đối tác B (rủi ro #7 trong R2).

## 5. Git và quy trình làm việc

`TODO(họp)`: chốt và cập nhật lại mục 6.2 trong Report 2 cho khớp.

- Nhánh chính: `main` (bản ổn định) và `develop` (tích hợp). Làm việc trên nhánh tách từ `develop`.
- Tên nhánh: `<loại>/<mô-tả-ngắn>`, ví dụ `feat/booking-hold`, `fix/refresh-token-race`. Các loại gồm `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.
- Commit theo Conventional Commits, có scope là module: `feat(booking): add room hold expiry job`.
- PR vào `develop` cần **ít nhất 1 người review** (BE review chéo: Khiêm và Phúc).
- Không commit `.env`, khóa API hay dữ liệu thật.

### Checklist trước khi mở PR

- [ ] `npm run lint` và `npm run build` không lỗi
- [ ] `npm run test:e2e` pass, đã thêm test cho endpoint mới
- [ ] Nếu có đổi schema thì đã kèm migration, và seed vẫn chạy được
- [ ] Endpoint mới đúng quy ước URL ở mục 1, đã có `@Roles` hoặc `@Public`, đã kiểm tra tenant nếu cần
- [ ] Đã cập nhật contract của phase trong `packages/docs/contracts/` (và [api-guide.md](../../packages/docs/api-guide.md) nếu đổi quy tắc chung) khi đổi hợp đồng API
