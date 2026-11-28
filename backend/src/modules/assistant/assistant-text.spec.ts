import {
  isInternalNote,
  maskCardNumbers,
  splitSuggestions,
  stripInternalNotes,
} from './assistant-text';

describe('assistant internal notes', () => {
  it('removes the note the model copied at the end of an answer', () => {
    const answer = [
      'Anh Cường muốn chốt loại phòng Superior Double hay Heritage Suite ạ?',
      '[Đã hiển thị: Superior Double (roomTypeId=d96c1655-716b-4e68-a5b9-e3de9baf695b); Heritage Suite (roomTypeId=5e5e1141-74b4-4904-9454-0df41118a321)]',
    ].join('\n');
    expect(stripInternalNotes(answer)).toBe(
      'Anh Cường muốn chốt loại phòng Superior Double hay Heritage Suite ạ?',
    );
  });

  it('knows every label the backend ever wrote, and any bracketed line with an id', () => {
    for (const line of [
      '[Loại phòng đã xem: Deluxe tại Biển Xanh (roomTypeId=abc)]',
      '[Đề xuất 1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed: Deluxe, 2 khách]',
      '[Hệ thống] Đã giữ phòng',
      '[Phòng: Deluxe (hotelId=x)]',
      '[ghi chú 1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed]',
    ]) {
      expect(isInternalNote(line)).toBe(true);
    }
  });

  it('leaves the customer-facing text alone, brackets and lists included', () => {
    const answer = [
      'Dạ, có 2 lựa chọn:',
      '1. **Superior Double**: 1.350.000 đ/đêm',
      '2. **Heritage Suite** [view phố cổ]: 2.100.000 đ/đêm',
      '',
      'Anh chọn phòng nào ạ?',
    ].join('\n');
    expect(stripInternalNotes(answer)).toBe(answer);
  });

  it('can leave nothing, which the caller treats as no answer', () => {
    expect(stripInternalNotes('[Đã hiển thị: A (hotelId=1)]\n')).toBe('');
  });
});

describe('assistant quick replies', () => {
  it('takes the last line of quick replies off the answer', () => {
    expect(
      splitSuggestions(
        'Có 2 nơi hợp với bạn.\n\n>> Xem phòng ở Sơn Trà | "Rẻ hơn chút" | Rẻ hơn chút | Đổi ngày | Thêm một',
      ),
    ).toEqual({
      text: 'Có 2 nơi hợp với bạn.',
      suggestions: ['Xem phòng ở Sơn Trà', 'Rẻ hơn chút', 'Đổi ngày'],
    });
  });

  it('leaves an answer without them alone', () => {
    expect(splitSuggestions('Chào bạn!')).toEqual({
      text: 'Chào bạn!',
      suggestions: [],
    });
  });
});

describe('card numbers in a customer message', () => {
  it('hides a card number and its security code', () => {
    expect(
      maskCardNumbers(
        'Tôi trả bằng thẻ: 4111 1111 1111 1111, hết hạn 12/28, CVV 123',
      ),
    ).toBe('Tôi trả bằng thẻ: •••• 1111, hết hạn 12/28, CVV •••');
    expect(maskCardNumbers('thẻ 5555-5555-5555-4444')).toBe('thẻ •••• 4444');
  });

  it('leaves phone numbers, booking codes and amounts alone', () => {
    const text =
      'SĐT 0901234567, mã SR-261014-7679, ngân sách 1500000 đ, số 1234567890123';
    expect(maskCardNumbers(text)).toBe(text);
  });
});
