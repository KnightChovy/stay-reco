# Phase N: <tên phase>

| | |
|---|---|
| Trạng thái phase | ⬜ Chưa bắt đầu · 🟡 Đang làm · ✅ Xong |
| Trạng thái API | `Draft` · `Agreed` · `BE Done` · `Integrated` |
| Ngày chốt (Agreed) | |
| BE phụ trách | |
| FE phụ trách | |
| API | [api/<vai trò>.md](../api/README.md) |

> Quy tắc chung (envelope, mã lỗi, phân trang, ngày giờ): [api-guide.md](../api-guide.md). Endpoint **không** ghi ở file này mà ở trang [api/](../api/README.md) của vai trò dùng nó.
>
> Quy trình trạng thái API:
> 1. **Draft**: BE hoặc FE viết đề xuất vào trang `api/`, đánh dấu *(Draft)*; ai cũng sửa được.
> 2. **Agreed**: BE + FE đã duyệt (qua PR). Từ đây đổi gì cũng phải ghi vào *Changelog* và báo bên kia.
> 3. **BE Done**: endpoint chạy được trên `develop`, Swagger khớp trang API. FE bỏ mock, gọi API thật.
> 4. **Integrated**: FE web và mobile đã tích hợp xong.

## Mục tiêu

## Phạm vi

**Backend**

-

**Frontend web / mobile**

-

## Ngoài phạm vi

-

## Quyết định đã chốt

| # | Quyết định |
|---|---|
| D1 | |

## Trạng thái

```
<enum>: A → B → C
```

## Khi thêm endpoint

- Schema body/query trong `packages/shared/src/schemas/<feature>.ts`, thêm **trước** khi code để FE làm song song ([packages/shared/README.md](../../packages/shared/README.md)).
- Endpoint, kiểu response, luồng gọi: trang `api/<vai trò>.md`.
- Mã lỗi mới: `packages/shared/src/errors.ts` **và** bảng [api-guide.md §4.3](../api-guide.md#43-error-codes).

## Việc của FE

-

## Câu hỏi còn mở

- [ ]

## Definition of Done

- [ ]

## Changelog

| Ngày | Ai | Thay đổi |
|---|---|---|
