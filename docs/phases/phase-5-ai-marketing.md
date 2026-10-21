# Phase 5: AI gợi ý và marketing

| | |
|---|---|
| Trạng thái | ⬜ Chưa bắt đầu |
| API | Chưa có. Khi phase bắt đầu: điền file này theo [`_template.md`](./_template.md), endpoint ghi vào [api/](../api/README.md). |

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
- [ ] Các trang [api/](../api/README.md) của phase khớp với code, trạng thái API `Integrated`
