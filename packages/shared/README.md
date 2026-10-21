# @stayreco/shared

Code dùng chung cho backend, frontend web và mobile: zod schema của body/query, enum, mã lỗi, kiểu response. BE validate bằng đúng schema mà FE dùng cho form, nên hai bên không lệch nhau.

| File | Nội dung |
|---|---|
| `src/schemas/<feature>.ts` | Zod schema của body/query (`createHotelSchema`, `loginSchema`…) và kiểu input (`CreateHotelInput`) |
| `src/responses/<feature>.ts` | Kiểu TypeScript của `data` trong response (`Hotel`, `Account`…) |
| `src/enums.ts` | `Role`, `AccountStatus`, `HotelStatus`, `RoomStatus`… (khớp `backend/prisma/schema.prisma`) |
| `src/errors.ts` | `ErrorCode` (bảng ý nghĩa ở [docs/api-guide.md §4.3](../../docs/api-guide.md#43-error-codes)) |
| `src/http.ts` | Envelope `APIResponse`, `APIError`, `PageMeta`, `ErrorDetail` |

Schema và kiểu nào dùng cho endpoint nào: xem các trang [docs/api/](../../docs/api/README.md).

## Cài đặt

Cả 3 app phụ thuộc bằng `"@stayreco/shared": "file:../packages/shared"` (symlink, không dùng workspaces hay turbo, mỗi app vẫn chạy riêng).

- **Lần đầu / sau khi pull**: `npm install` trong app bạn làm là đủ. `postinstall` tự cài và build shared ra `dist/`. Các lệnh `dev`, `build` (mobile: `start`) cũng tự build lại shared trước khi chạy.
- **Đang sửa shared liên tục**: mở thêm một terminal `cd packages/shared && npm run dev` (tsc watch) để app thấy thay đổi ngay.

## Dùng

- **Backend**: `export class CreateHotelDto extends zodDto(createHotelSchema) {}` (`backend/src/common/pipes/validation.ts`).
- **FE / mobile**: `import { loginSchema, type LoginInput, ErrorCode } from '@stayreco/shared'`. Khi cần tự viết schema trên client thì import `z` từ `@stayreco/shared` để dùng chung một bản zod với các schema có sẵn.

## Thêm schema cho feature mới

- Tạo `src/schemas/<feature>.ts`, export trong `src/index.ts`. Đặt tên `xxxSchema`, kèm `export type XxxInput = z.infer<typeof xxxSchema>`. Dùng `z.strictObject` cho body để field lạ bị từ chối.
- Kiểu response đặt ở `src/responses/<feature>.ts`.
- Enum trong `src/enums.ts` phải khớp `backend/prisma/schema.prisma`. Sửa enum Prisma thì sửa luôn file này.
- Thêm mã lỗi: `src/errors.ts` **và** bảng trong [docs/api-guide.md §4.3](../../docs/api-guide.md#43-error-codes).
