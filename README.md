# StayReco

Nền tảng đặt phòng khách sạn có gợi ý bằng AI: khách hàng tìm và đặt phòng, đối tác đưa khách sạn lên và vận hành, quản lý nền tảng duyệt và giám sát.

## Cấu trúc repo

| Thư mục | Nội dung |
|---|---|
| [backend/](./backend/) | API: NestJS 11, Prisma 7, PostgreSQL 16 (pgvector) |
| [frontend/](./frontend/) | Web: Next.js |
| [mobile/](./mobile/) | App: Expo (React Native) |
| [packages/shared/](./packages/shared/README.md) | Zod schema, enum, mã lỗi, kiểu response dùng chung cho cả 3 app |
| [docs/](./docs/README.md) | Tài liệu chung: chạy ở máy, quy tắc API, endpoint theo vai trò, kế hoạch từng phase |

Mỗi app cài và chạy riêng trong thư mục của nó (không dùng workspaces).

## Bắt đầu

- Chạy ở máy: [docs/getting-started.md](./docs/getting-started.md)
- Quy tắc gọi API: [docs/api-guide.md](./docs/api-guide.md)
- Endpoint theo vai trò: [docs/api/](./docs/api/README.md)
- Đang làm phase nào: [docs/README.md](./docs/README.md#đang-ở-đâu)
- Quy ước code backend: [backend/docs/CONVENTIONS.md](./backend/docs/CONVENTIONS.md)
