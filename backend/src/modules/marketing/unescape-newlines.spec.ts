import { unescapeNewlines } from './ai.service';

describe('unescapeNewlines', () => {
  it('turns a line break the model escaped twice into a real one', () => {
    expect(unescapeNewlines({ title: 'Chào', body: 'a\\n\\nb' })).toEqual({
      title: 'Chào',
      body: 'a\n\nb',
    });
  });

  it('handles \\r\\n and \\r, and makes a tab a space', () => {
    expect(unescapeNewlines('a\\r\\nb\\rc\\td')).toBe('a\nb\nc d');
  });

  it('reaches strings inside arrays and nested objects', () => {
    expect(
      unescapeNewlines({ variants: [{ body: 'x\\ny' }, { body: 'z' }] }),
    ).toEqual({ variants: [{ body: 'x\ny' }, { body: 'z' }] });
  });

  it('leaves real line breaks and other values alone', () => {
    expect(
      unescapeNewlines({ body: 'a\nb', n: 3, ok: true, none: null }),
    ).toEqual({ body: 'a\nb', n: 3, ok: true, none: null });
  });
});
