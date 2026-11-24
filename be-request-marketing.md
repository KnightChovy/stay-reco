# Yêu cầu sửa BE — Marketing (phase 5)

Người gửi: FE (staff + customer). Phạm vi: `backend/src/modules/marketing`, `docs/api/marketing.md`.
Không đổi schema database, không đổi response, không thêm endpoint.

Gồm 2 việc:

1. [Cho staff sửa bài đã duyệt, sửa xong chủ duyệt lại](#1-cho-staff-sửa-bài-đã-duyệt) — **ưu tiên**
2. [Bài AI viết bị dính chữ `\n`](#2-bài-ai-viết-bị-dính-chữ-n)

---

## 1. Cho staff sửa bài đã duyệt

### Hiện trạng

`ContentService.editable()` (`src/modules/marketing/content.service.ts:296`) chỉ cho sửa khi bài là `DRAFT` hoặc `REJECTED`:

```ts
if (content.status !== 'DRAFT' && content.status !== 'REJECTED') {
  throw wrongStatus('Only a draft or a rejected piece can be edited');
}
```

Hệ quả: bài đã `APPROVED` không sửa được, không từ chối được (`reject` chỉ nhận `PENDING_APPROVAL`), không xoá được (`remove` chỉ nhận `DRAFT`/`REJECTED`) và không có đường nào về nháp. Staff thấy sai một chữ cũng phải viết lại bài từ đầu, và bài cũ nằm mãi trong danh sách.

### Yêu cầu

Staff có quyền `MARKETING` vẫn sửa được chữ và ảnh của bài đã duyệt. **Sửa xong bài quay về `DRAFT` và phải gửi chủ khách sạn duyệt lại.** Nguyên tắc "bài đăng lên đúng là bản chủ đã duyệt" vẫn giữ nguyên.

| Trạng thái hiện tại | Sửa được? | Khi sửa thì |
|---|---|---|
| `DRAFT` | Có (như cũ) | giữ `DRAFT` |
| `REJECTED` | Có (như cũ) | → `DRAFT` (như cũ) |
| `APPROVED` | **Có (mới)** | → `DRAFT` |
| `SCHEDULED` | **Có (mới)** | huỷ các lịch đang chờ của bài → `DRAFT` |
| `PENDING_APPROVAL` | Không (như cũ) | đang chờ chủ duyệt; muốn sửa thì chủ từ chối trước |
| `PUBLISHED` | Không | bài đã lên fanpage, sửa sẽ làm dữ liệu lệch với bài đã đăng; muốn đổi thì tạo bài mới |

Nếu bài có một lịch đang `PUBLISHING` (job đang gọi Meta) → trả `409 CONTENT_STATUS_CONFLICT`, thông điệp kiểu *"The piece is being posted right now; try again in a few minutes."*

### Cách sửa

**a) `editable()` nhận thêm `APPROVED` và `SCHEDULED`**

```ts
const EDITABLE = ['DRAFT', 'REJECTED', 'APPROVED', 'SCHEDULED'] as const;

async editable(user: AuthUser, contentId: string) {
  const content = await this.owned(user, contentId, 'member');
  if (!EDITABLE.includes(content.status)) {
    throw wrongStatus('Only a draft, a rejected or an approved piece that is not out yet can be edited');
  }
  if (content.status === 'SCHEDULED') {
    const posting = await this.prisma.contentSchedule.count({
      where: { marketingContentId: contentId, status: 'PUBLISHING' },
    });
    if (posting) throw wrongStatus('The piece is being posted right now; try again in a few minutes.');
  }
  return content;
}
```

**b) Thêm helper `reopen()`: đưa bài đã duyệt về nháp, chạy trong một transaction**

```ts
/** An edit after approval: cancel what is still waiting to go out and send the piece back to the writer. */
private async reopen(tx: Prisma.TransactionClient, contentId: string) {
  const { count: cancelled } = await tx.contentSchedule.updateMany({
    where: { marketingContentId: contentId, status: 'SCHEDULED' },
    data: { status: 'CANCELLED' },
  });
  // Conditional on the status so a publisher run that claimed it in between wins, not the edit.
  const { count } = await tx.marketingContent.updateMany({
    where: { marketingContentId: contentId, status: { in: ['APPROVED', 'SCHEDULED'] } },
    data: { status: 'DRAFT' },
  });
  if (!count) throw wrongStatus('The piece changed while saving; reload it.');
  return cancelled;
}
```

- Lịch ở `PUBLISHED` / `FAILED` / `CANCELLED` giữ nguyên.
- Ghi audit với action mới `CONTENT_REOPENED` (thêm vào enum TS trong `src/modules/audit/audit.service.ts`, cạnh `CONTENT_APPROVED`; không cần migration), metadata: `{ contentId, hotelId, cancelledSchedules }`.

**c) Gọi `reopen()` ở mọi chỗ sửa nội dung**, khi bài đang `APPROVED` hoặc `SCHEDULED`:

- `ContentService.update()` (`content.service.ts:305`): gộp `reopen` và `marketingContent.update` vào cùng `$transaction`; bỏ dòng `...(content.status === 'REJECTED' && { status: 'DRAFT' })` thay bằng: nếu `REJECTED` → `DRAFT`, nếu `APPROVED`/`SCHEDULED` → `reopen()` rồi mới update chữ.
- `content-images.service.ts` dòng 53, 86, 98 (tải ảnh lên, AI vẽ ảnh, xoá ảnh): đổi ảnh cũng phải duyệt lại → gọi `reopen()` khi bài đang `APPROVED`/`SCHEDULED`. Có thể cho `editable()` trả kèm cờ `needsReopen` để hai service dùng chung, tránh lệch nhau.

**d) (Nên có) Báo chủ khách sạn**

Khi bài được gửi duyệt lại (`submit`) mà trước đó đã từng `APPROVED` (tra audit `CONTENT_REOPENED`), thông báo cho chủ: *"Bài «{title}» đã được sửa sau khi duyệt, cần duyệt lại."*

**e) Cập nhật `docs/api/marketing.md`**

- Sơ đồ trạng thái thêm mũi tên:
  ```
  [APPROVED] / [SCHEDULED] ─→ edit ─→ [DRAFT]   (lịch đang chờ bị huỷ)
  ```
- Sửa câu *"The text is frozen on approval"* thành: chữ và ảnh bị khoá khi đang chờ duyệt (`PENDING_APPROVAL`) và khi đã đăng (`PUBLISHED`); sửa sau khi duyệt đưa bài về nháp và cần chủ duyệt lại, nên bài đăng lên vẫn luôn là bản chủ đã duyệt.
- Mục lỗi `CONTENT_STATUS_CONFLICT`: thêm trường hợp bài đang được đăng.

### Test cần có

| Trường hợp | Kết quả mong đợi |
|---|---|
| `PATCH` bài `APPROVED` | 200, `status: DRAFT`, chữ mới |
| `PATCH` bài `SCHEDULED` có 2 lịch chờ | 200, `DRAFT`, cả 2 lịch → `CANCELLED` |
| `PATCH` bài có lịch `PUBLISHING` | 409 `CONTENT_STATUS_CONFLICT`, không đổi gì |
| `PATCH` bài `PUBLISHED` | 409 |
| `PATCH` bài `PENDING_APPROVAL` | 409 (như cũ) |
| Tải / vẽ / xoá ảnh bài `APPROVED` | 200, `DRAFT` |
| Sửa xong → `submit` → `approve` | `APPROVED`, lên lịch được lại |
| Staff không có `MARKETING` | 403 (như cũ) |
| Có audit `CONTENT_REOPENED` | ghi đúng số lịch bị huỷ |

---

## 2. Bài AI viết bị dính chữ `\n`

### Hiện tượng

Nội dung bài AI viết đôi khi có hai ký tự `\` `n` thay vì xuống dòng thật, ví dụ bài *"Hẹn nhau một chuyến đi"* của Ngũ Hành Sơn Garden Retreat (`62ce4b46-058c-4202-ad04-ab403eef0047`). Đăng lên Facebook sẽ ra nguyên chữ `\n`.

### Nguyên nhân

- Gemini đôi lúc escape hai lần trong JSON trả về.
- `AiService.ask()` (`src/modules/marketing/ai.service.ts`, khoảng dòng 191–202) `JSON.parse` → `schema.safeParse` → trả `parsed.data`, không làm sạch.
- `ContentService.variants()` trả thẳng `body: v.body`; `create()` lưu nguyên vào database.

### Cách sửa

**a) Làm sạch ngay sau khi parse trong `ai.service.ts`** (áp dụng cho mọi tính năng AI):

```ts
const unescape = (value: unknown): unknown =>
  typeof value === 'string'
    ? value.replace(/\\r\\n|\\n|\\r/g, '\n').replace(/\\t/g, ' ')
    : Array.isArray(value)
      ? value.map(unescape)
      : value && typeof value === 'object'
        ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, unescape(v)]))
        : value;

const parsed = schema.safeParse(unescape(json));
```

**b) Sửa dữ liệu cũ** (migration hoặc chạy một lần):

```sql
UPDATE marketing_content
SET body  = replace(replace(body, E'\\r\\n', E'\n'), E'\\n', E'\n'),
    title = replace(replace(title, E'\\r\\n', E'\n'), E'\\n', E'\n')
WHERE body LIKE E'%\\\\n%' OR title LIKE E'%\\\\n%';
```

Lưu ý: câu này sửa cả bài đã `APPROVED` (chỉ đổi định dạng xuống dòng, không đổi nội dung chủ đã duyệt).

**c) Test:** cho model giả trả `"a\\n\\nb"` → `body` lưu là `"a\n\nb"`.

### Ngoài lề

AI viết sai địa điểm: bài cho khách sạn ở **Đà Nẵng** mở đầu bằng *"Đi Đà Lạt nhé"*. Nên đưa thành phố của khách sạn vào prompt (`promptFor`) và dặn model không nhắc địa danh khác.

---

## Phía FE

- Đã có: `frontend/src/services/marketing.service.ts` tạm đổi `\n` thành xuống dòng khi đọc từ API, nên các màn staff hiển thị đúng. Gỡ được sau khi BE sửa mục 2.
- Sẽ làm sau khi BE xong mục 1: bài `APPROVED` / `SCHEDULED` có nút **"Sửa bài"**, bấm thì hỏi xác nhận *"Sửa bài sẽ huỷ lịch đăng (nếu có) và cần chủ khách sạn duyệt lại"*; lưu xong bài về nháp rồi gửi duyệt như thường.
