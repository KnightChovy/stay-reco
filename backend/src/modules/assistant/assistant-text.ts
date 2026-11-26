/**
 * Internal notes that must never reach the customer.
 *
 * The ids of hotels, room types and proposals shown earlier are handed to the model as lookup data (in the system
 * instruction, see AssistantService.history). Until 2026-11-26 they were appended to the model's own past turns, and
 * the model, seeing itself write them, started writing such lines at the end of new answers, ids and all. The lines
 * below are what it produced; this removes them from an answer before it is stored and from old answers when they are
 * read back, so a conversation that caught the habit shows clean text too.
 */

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
/** The labels of the notes the backend wrote, and the model learned to imitate. */
const NOTE_START =
  /^\s*\[(Đã hiển thị|Loại phòng đã xem|Đề xuất(?: huỷ)? |Hệ thống\]|Dữ liệu nội bộ)/i;

/** One line that is an internal note: a known label, or anything in brackets that carries an id. */
export function isInternalNote(line: string): boolean {
  const trimmed = line.trim();
  if (NOTE_START.test(trimmed)) return true;
  return (
    trimmed.startsWith('[') &&
    trimmed.endsWith(']') &&
    (/\b(hotelId|roomTypeId|proposalId|bookingId)\s*=/i.test(trimmed) ||
      UUID.test(trimmed))
  );
}

/** The answer without its internal-note lines, and without the blank lines they leave at the end. */
export function stripInternalNotes(text: string): string {
  return text
    .split('\n')
    .filter((line) => !isInternalNote(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
