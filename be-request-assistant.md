# Yêu cầu sửa BE: Trợ lý AI lộ ghi chú nội bộ có ID

Người gửi: FE (customer). Phạm vi: `backend/src/modules/assistant` (`assistant.service.ts`, có thể cả `assistant.prompt.ts`).
Không đổi schema database, không đổi response, không thêm endpoint.

---

## Hiện tượng

Câu trả lời của trợ lý đôi khi có thêm một dòng ghi chú nội bộ ở cuối, **khách nhìn thấy cả ID**:

```
Anh Cường muốn chốt loại phòng Superior Double hay Heritage Suite để em lên đề xuất đặt phòng cho mình ạ?
[Đã hiển thị: Superior Double (roomTypeId=d96c1655-716b-4e68-a5b9-e3de9baf695b); Heritage Suite (roomTypeId=5e5e1141-74b4-4904-9454-0df41118a321)]
```

Dòng `[...]` nằm sẵn trong `reply.content` mà `POST /conversations/:id/messages` trả về và đã được lưu vào bảng `message`. FE chỉ render đúng chữ nhận được, nên đây không phải lỗi FE.

**Cách tái hiện:** chat vài lượt để trợ lý hiện thẻ khách sạn hoặc liệt kê loại phòng (`get_hotel_rooms`), rồi trả lời tiếp, ví dụ "cái này nhé". Càng về các lượt sau càng dễ gặp.

## Nguyên nhân

`AssistantService.history()` (`src/modules/assistant/assistant.service.ts:353-392`) dựng lại lịch sử để gửi cho Gemini. Với mỗi tin `ASSISTANT` cũ, hàm nối thêm ghi chú có ID **vào cuối chính lượt nói của model**:

```ts
notes.push(`[Đã hiển thị: ${meta.hotels.map((h) => `${h.name} (hotelId=${h.id})`).join('; ')}]`);          // :374
notes.push(`[Loại phòng đã xem: ${... (roomTypeId=${r.id})}]`);                                         // :379
notes.push(`[Đề xuất ${p.id}: ${p.roomTypeName} (roomTypeId=${p.roomTypeId}) ...]`);                     // :385
...
return { role: 'model', parts: [{ text: [prefix + m.content, ...notes].join('\n') }] };                  // :388-391
```

Vì ghi chú nằm trong `role: 'model'`, Gemini hiểu rằng **chính nó đã từng viết như vậy**, rồi bắt chước và tự viết thêm một dòng `[...]` ở cuối câu trả lời mới. Bằng chứng: dòng bị lộ trong ví dụ là định dạng AI tự chế (`Đã hiển thị` + `roomTypeId`), trộn giữa hai mẫu ở dòng 374 và 379; backend không tạo ra chuỗi này.

Quy tắc 8 trong `assistant.prompt.ts` ("Không nhắc tới id…") không ngăn được, vì lịch sử hội thoại đang dạy ngược lại.

Sau đó câu trả lời được lưu nguyên văn (`text = response.text?.trim()` ở dòng 261, ghi vào `message.content` ở dòng 324-328), và ghi chú lại bị đưa vào lịch sử của các lượt sau. Lỗi tự nhân lên theo thời gian.

## Yêu cầu

### 1. Không để ghi chú ID nằm trong lượt nói của model (gốc rễ)

Vẫn giữ ID cho model dùng ("lấy cái thứ hai"), nhưng **tách ra khỏi `role: 'model'`**. Một trong hai cách:

- **(Khuyến nghị)** Gom các ID đã hiển thị, đã xem, đã đề xuất thành một khối ngữ cảnh riêng, đặt vào `systemInstruction` (hoặc một lượt `user` riêng ngay trước câu hỏi mới), ghi rõ ví dụ: *"Dữ liệu nội bộ để tra cứu id. Không bao giờ chép lại khối này hay bất kỳ id nào vào câu trả lời."*
- Hoặc giữ ghi chú theo từng lượt, nhưng đưa vào một `part` có nhãn rõ là dữ liệu hệ thống, không nằm chung `text` với lời của model.

### 2. Lọc lại đầu ra trước khi lưu (lớp chặn cuối)

Sau `text = response.text?.trim()` (dòng 261) và **trước khi lưu** (dòng 324), bỏ mọi dòng có dạng ghi chú nội bộ:

- dòng bắt đầu bằng `[Đã hiển thị`, `[Loại phòng đã xem`, `[Đề xuất `, `[Hệ thống]`
- và nói chung là mọi dòng nằm trong `[...]` có chứa `hotelId=`, `roomTypeId=` hoặc một UUID

Nếu sau khi lọc mà `text` rỗng thì xử lý như khi model không trả lời (theo luồng lỗi đang có).

### 3. Dọn tin nhắn cũ đã bị lộ

Các hội thoại hiện có đã lưu sẵn dòng `[...]` trong `message.content`. Làm một trong hai việc:

- áp cùng hàm lọc ở bước 2 khi đọc ra trong `toMessage()` (dòng 442), hoặc
- chạy một lần script cập nhật các `message` có `role = 'ASSISTANT'` chứa `roomTypeId=` / `hotelId=`.

## Tiêu chí nghiệm thu

- [ ] Chat 6–8 lượt (gợi ý → tìm theo ngày → xem loại phòng → "cái thứ hai" → đề xuất đặt phòng): không câu trả lời nào chứa `[`…`id=`…`]` hay UUID.
- [ ] Trợ lý vẫn hiểu "cái thứ hai", "phòng rẻ hơn", "đặt cái đó" mà không phải tìm lại (tức là ID vẫn còn tới được model).
- [ ] Mở lại một hội thoại cũ đã bị lỗi: không còn thấy dòng `[...]`.
- [ ] Có unit test cho hàm lọc ở bước 2.

---

## Ghi chú: phần FE tự sửa (không cần BE làm)

Trong cùng ảnh chụp, hai loại phòng đều được đánh số "1." (đúng ra phải là "1." và "2."). Đây là lỗi của bộ render Markdown ở FE (`frontend/src/features/assistant/lib/chat-markdown.tsx`): danh sách số bị ngắt bởi các dòng gạch đầu dòng, và mỗi đoạn lại bắt đầu từ 1. FE sẽ tự sửa.
