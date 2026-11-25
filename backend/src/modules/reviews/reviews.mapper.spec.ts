import { displayName } from './reviews.mapper';

describe('displayName', () => {
  it('shortens the last word to an initial, the way hotel sites show reviewers', () => {
    expect(displayName('Nguyễn Văn An')).toBe('Nguyễn Văn A.');
    expect(displayName('Trần Bảo')).toBe('Trần B.');
  });

  it('leaves a single-word name alone', () => {
    expect(displayName('Mai')).toBe('Mai');
  });

  it('ignores the spacing around and inside the name', () => {
    expect(displayName('  Lê   Thị  Hoa  ')).toBe('Lê Thị H.');
  });
});
