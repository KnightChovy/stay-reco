# StayReco docs

Nơi BE, FE web và mobile thống nhất **đang làm phase nào** và **API trông như thế nào**.

## Bắt đầu từ đâu

| Bạn là | Đọc theo thứ tự |
|---|---|
| Mới vào dự án | [getting-started.md](./getting-started.md) → [api-guide.md](./api-guide.md) → trang API của màn hình bạn làm |
| FE web / mobile | [api-guide.md](./api-guide.md) (token, envelope, mã lỗi) → [api/](./api/README.md): [auth](./api/auth.md) · [đối tác](./api/partner.md) · [nhân viên](./api/staff.md) · [quản lý](./api/manager.md) · [khách hàng](./api/customer.md) |
| BE | [../backend/docs/CONVENTIONS.md](../backend/docs/CONVENTIONS.md) (quy ước code) → [phases/](./phases/) (quyết định, phạm vi) → cập nhật [api/](./api/README.md) cùng PR với code |
| Dùng schema chung | [../packages/shared/README.md](../packages/shared/README.md) |

## Cấu trúc

| Đường dẫn | Nội dung |
|---|---|
| [getting-started.md](./getting-started.md) | Chạy backend và frontend ở máy, tài khoản demo, lỗi hay gặp |
| [api-guide.md](./api-guide.md) | Quy tắc chung cho mọi API: base URL, token web/mobile, envelope, bảng mã lỗi, phân trang |
| [api/](./api/README.md) | Endpoint theo vai trò người dùng: mỗi endpoint ghi một lần, kèm schema, kiểu response, luồng gọi |
| [phases/](./phases/) | Mỗi phase một file: mục tiêu, phạm vi, quyết định đã chốt, trạng thái, việc của FE, Definition of Done, changelog |

## Đang ở đâu

> **Phase 1**: BE xong, FE web và mobile đang tích hợp. Phase 2 (tìm kiếm, đặt phòng, SePay) sắp bắt đầu: đang viết trang API.
> Cập nhật dòng này và bảng dưới trong cùng PR khi đổi trạng thái.

| Phase | Nội dung | Trạng thái | API |
|---|---|---|---|
| [0](./phases/phase-0-foundation.md) | Nền tảng: auth, envelope, shared | 🟡 BE xong, FE đang tích hợp | [auth](./api/auth.md) |
| [1](./phases/phase-1-hotel-onboarding.md) | Đối tác đưa khách sạn lên, quản lý duyệt | 🟡 BE xong, FE đang tích hợp | [đối tác](./api/partner.md), [nhân viên](./api/staff.md), [quản lý](./api/manager.md) |
| [2](./phases/phase-2-search-booking.md) | Tìm kiếm, đặt phòng, thanh toán | ⬜ Chưa bắt đầu | |
| [3](./phases/phase-3-operations.md) | Vận hành: check-in/out, hoàn tiền, inbox | ⬜ Chưa bắt đầu | |
| [4](./phases/phase-4-loyalty-promotions.md) | Loyalty, khuyến mãi, đánh giá, ví | ⬜ Chưa bắt đầu | |
| [5](./phases/phase-5-ai-marketing.md) | AI gợi ý, trợ lý, marketing | ⬜ Chưa bắt đầu | |
| [6](./phases/phase-6-reporting-admin.md) | Báo cáo, quản trị | ⬜ Chưa bắt đầu | |

Trạng thái phase: ⬜ Chưa bắt đầu · 🟡 Đang làm · ✅ Xong.
Trạng thái API của một phase: `Draft` → `Agreed` → `BE Done` → `Integrated` (ghi ở đầu file phase).

## Quy trình một phase

1. **Mở phase**: điền file `phases/phase-N-<tên>.md` theo [`phases/_template.md`](./phases/_template.md); endpoint đề xuất ghi thẳng vào trang `api/<vai trò>.md`, đánh dấu *(Draft)* (`Draft`).
2. **Chốt**: PR chỉ chứa docs + schema trong `packages/shared`. BE và FE cùng review, merge thì chuyển `Agreed`.
3. **Làm song song**: BE code endpoint theo schema; FE dựng form bằng chính schema đó và mock response theo trang API.
4. **BE Done**: endpoint lên `develop`, Swagger khớp trang API. FE chuyển sang API thật.
5. **Integrated**: web và mobile xong, tick Definition of Done, cập nhật bảng ở trên.

Đổi API sau khi đã `Agreed`: sửa trang `api/`, thêm dòng *Changelog* ở file phase, báo bên còn lại. Không đổi tên field hay mã lỗi đã công bố, chỉ thêm mới.
