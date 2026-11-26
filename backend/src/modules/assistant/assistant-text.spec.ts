import { isInternalNote, stripInternalNotes } from './assistant-text';

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
