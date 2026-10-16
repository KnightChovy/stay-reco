# Contract phase N: <tên phase>

| | |
|---|---|
| Trạng thái | `Draft` · `Agreed` · `BE Done` · `Integrated` |
| Phase | [phase-N-...](../phases/phase-N-....md) |
| BE phụ trách | |
| FE phụ trách | |
| Ngày chốt (Agreed) | |

> Quy tắc chung (envelope, mã lỗi, phân trang, ngày giờ): [api-guide.md](../api-guide.md). File này chỉ ghi phần **riêng** của phase.
>
> Quy trình trạng thái:
> 1. **Draft**: BE hoặc FE viết đề xuất, ai cũng sửa được.
> 2. **Agreed**: BE + FE đã duyệt (qua PR). Từ đây đổi gì cũng phải ghi vào *Changelog* và báo bên kia.
> 3. **BE Done**: endpoint chạy được trên `develop`, Swagger khớp contract. FE bỏ mock, gọi API thật.
> 4. **Integrated**: FE web và mobile đã tích hợp xong.

## Schema dùng chung

Body/query validate bằng schema trong `packages/shared/src/schemas/<feature>.ts`. BE bọc bằng `zodDto`, FE dùng với form. Thêm schema **trước** khi code endpoint để FE làm song song.

| Schema | Dùng cho |
|---|---|
| `xxxSchema` | `POST /xxx` |

## Endpoint

Cột **Response** là nội dung của `data` (xem api-guide §4.1).

| Method | Path | Quyền | Body / Query (schema) | Response | Trạng thái |
|---|---|---|---|---|---|
| GET | `/xxx` | | | `Xxx[]` + `meta` | Draft |

## Kiểu dữ liệu response

```jsonc
// Xxx
{ "id": "uuid" }
```

## Mã lỗi mới

Thêm vào `packages/shared/src/errors.ts` **và** bảng 4.3 trong [api-guide.md](../api-guide.md#43-bảng-mã-lỗi).

| `code` | HTTP | Khi nào | Gợi ý FE |
|---|---|---|---|

## Câu hỏi còn mở

- [ ]

## Changelog

| Ngày | Ai | Thay đổi |
|---|---|---|
