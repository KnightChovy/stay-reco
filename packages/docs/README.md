# StayReco docs

Nơi BE, FE web và mobile thống nhất **đang làm phase nào** và **API trông như thế nào**.

| File | Nội dung |
|---|---|
| [api-guide.md](./api-guide.md) | Quy tắc chung cho mọi API: base URL, token web/mobile, envelope response, bảng mã lỗi, phân trang |
| [phases/](./phases/) | Mỗi phase một file: mục tiêu, phạm vi BE/FE, Definition of Done |
| [contracts/](./contracts/) | Mỗi phase một contract: endpoint, schema, response, mã lỗi, trạng thái từng endpoint |
| [../../backend/docs/CONVENTIONS.md](../../backend/docs/CONVENTIONS.md) | Quy ước code nội bộ backend |

## Đang ở đâu

> **Phase hiện tại: 0** — BE xong auth, FE web và mobile đang tích hợp. Phase 1 đang viết contract nháp.
> Cập nhật dòng này và bảng dưới trong cùng PR khi đổi trạng thái.

| Phase | Nội dung | Trạng thái | Contract |
|---|---|---|---|
| [0](./phases/phase-0-foundation.md) | Nền tảng: auth, envelope, shared | 🟡 Đang làm | [BE Done](./contracts/phase-0-foundation.md) |
| [1](./phases/phase-1-hotel-onboarding.md) | Đối tác đưa khách sạn lên, quản lý duyệt | 🟡 Đang làm | [Agreed (BE)](./contracts/phase-1-hotel-onboarding.md) |
| [2](./phases/phase-2-search-booking.md) | Tìm kiếm, đặt phòng, thanh toán | ⬜ Chưa bắt đầu | |
| [3](./phases/phase-3-operations.md) | Vận hành: check-in/out, hoàn tiền, inbox | ⬜ Chưa bắt đầu | |
| [4](./phases/phase-4-loyalty-promotions.md) | Loyalty, khuyến mãi, đánh giá, ví | ⬜ Chưa bắt đầu | |
| [5](./phases/phase-5-ai-marketing.md) | AI gợi ý, trợ lý, marketing | ⬜ Chưa bắt đầu | |
| [6](./phases/phase-6-reporting-admin.md) | Báo cáo, quản trị | ⬜ Chưa bắt đầu | |

Trạng thái phase: ⬜ Chưa bắt đầu · 🟡 Đang làm · ✅ Xong.
Trạng thái contract: `Draft` → `Agreed` → `BE Done` → `Integrated` (chi tiết trong [`contracts/_template.md`](./contracts/_template.md)).

## Quy trình một phase

1. **Mở phase**: copy `contracts/_template.md` thành `contracts/phase-N-<tên>.md`, viết endpoint đề xuất (`Draft`).
2. **Chốt contract**: PR chỉ chứa contract + schema trong `packages/shared`. BE và FE cùng review, merge thì chuyển `Agreed`.
3. **Làm song song**: BE code endpoint theo schema; FE dựng form bằng chính schema đó và mock response theo contract.
4. **BE Done**: endpoint lên `develop`, Swagger khớp contract. FE chuyển sang API thật.
5. **Integrated**: web và mobile xong, tick Definition of Done, cập nhật bảng ở trên.

Đổi contract sau khi đã `Agreed`: sửa file, thêm dòng *Changelog*, báo bên còn lại. Không đổi tên field hay mã lỗi đã công bố, chỉ thêm mới.

## `packages/shared`

Package `@stayreco/shared`: zod schema, `ErrorCode`, `Role`, `AccountStatus`, kiểu `APIResponse` / `APIError`. Cả 3 app phụ thuộc bằng `"@stayreco/shared": "file:../packages/shared"` (symlink, không dùng workspaces hay turbo, mỗi app vẫn chạy riêng).

- **Cài lần đầu / sau khi pull**: `npm install` trong app bạn làm là đủ. `postinstall` tự cài và build shared ra `dist/`. Các lệnh `dev`, `build` (mobile: `start`) cũng tự build lại shared trước khi chạy.
- **Đang sửa shared liên tục**: mở thêm một terminal `cd packages/shared && npm run dev` (tsc watch) để app thấy thay đổi ngay.
- **Thêm schema cho feature mới**: tạo `src/schemas/<feature>.ts`, export trong `src/index.ts`. Đặt tên `xxxSchema`, kèm `export type XxxInput = z.infer<typeof xxxSchema>`. Dùng `z.strictObject` cho body để field lạ bị từ chối.
- **Backend** dùng: `export class CreateHotelDto extends zodDto(createHotelSchema) {}` (`backend/src/common/pipes/validation.ts`).
- **FE / mobile** dùng: `import { loginSchema, type LoginInput, ErrorCode } from '@stayreco/shared'`. Khi cần tự viết schema trên client thì import `z` từ `@stayreco/shared` để dùng chung một bản zod.
- Enum trong `src/enums.ts` phải khớp `backend/prisma/schema.prisma`. Sửa enum Prisma thì sửa luôn file này.
