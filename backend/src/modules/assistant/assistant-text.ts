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

/** Longest quick reply kept: a tap-sized answer, not a sentence. */
const SUGGESTION_MAX = 60;

/**
 * The answer and the quick replies the model offered with it. The prompt asks for them as a last line
 * `>> Xem phòng | Rẻ hơn chút | Đổi ngày`; that line is taken off the text and returned as buttons. At most three,
 * each short; anything else on the line is dropped rather than shown.
 */
export function splitSuggestions(text: string): {
  text: string;
  suggestions: string[];
} {
  const lines = text.split('\n');
  const at = lines.findIndex((line) => line.trim().startsWith('>>'));
  if (at === -1) return { text: text.trim(), suggestions: [] };
  const suggestions = [
    ...new Set(
      lines[at]
        .trim()
        .slice(2)
        .split('|')
        .map((s) => s.trim().replace(/^["“]|["”]$/g, ''))
        .filter((s) => s && s.length <= SUGGESTION_MAX),
    ),
  ].slice(0, 3);
  return {
    // The line and anything the model wrote after it.
    text: lines.slice(0, at).join('\n').trim(),
    suggestions,
  };
}
