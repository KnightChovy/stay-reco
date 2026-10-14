# Phase 5: AI gợi ý và marketing

| | |
|---|---|
| Trạng thái | ⬜ Chưa bắt đầu |
| Contract | Chưa có. Tạo từ [`_template.md`](../contracts/_template.md) khi phase bắt đầu. |

## Mục tiêu

Gợi ý khách sạn bằng AI, trợ lý hội thoại, công cụ nội dung marketing cho khách sạn.

## Phạm vi

**Backend**

- pgvector, embedding khách sạn (CONVENTIONS §3.7)
- Gợi ý cá nhân hóa, trợ lý AI
- AI brand cho đối tác, lịch và nội dung marketing
- Blog

**Frontend web / mobile** (trang đã có UI trong `frontend/src/app`)

- `(landing-page)/recommendations`, `(landing-page)/assistant`, `blog`, `FloatingAiButton`
- `partner/ai-brand`
- `staff/marketing/*`

## Definition of Done

- [ ] Có giới hạn chi phí gọi model và log lượt gọi
- [ ] Contract đã cập nhật đúng với code, trạng thái `Integrated`
