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

// ── Card numbers ─────────────────────────────────────────────

/** 13 to 19 digits, possibly grouped by spaces or dashes, as a card number is written. */
const CARD_LIKE = /\b\d(?:[ -]?\d){12,18}\b/g;
/** The security code after its usual labels. */
const SECURITY_CODE = /\b(CVV2?|CVC2?|CSC|mã bảo mật)(\s*[:=]?\s*)\d{3,4}\b/gi;

/** The Luhn checksum every payment card number passes, so an order or phone number is not taken for one. */
function passesLuhn(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/**
 * A customer message with any payment card number and security code hidden, applied before the message is stored or
 * sent to the model: the chat never takes payment, and a card typed into it must not end up in the database or with
 * the model provider. The last four digits stay so the assistant can still say which card it hid.
 */
export function maskCardNumbers(text: string): string {
  return text
    .replace(CARD_LIKE, (match) => {
      const digits = match.replace(/[ -]/g, '');
      return digits.length >= 13 && digits.length <= 19 && passesLuhn(digits)
        ? `•••• ${digits.slice(-4)}`
        : match;
    })
    .replace(
      SECURITY_CODE,
      (_m, label: string, gap: string) => `${label}${gap}•••`,
    );
}
