import { isOwnVerificationFile } from './verification-documents';

const PARTNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const folder = (id: string) => `stayreco/verification/${id}`;

describe('isOwnVerificationFile', () => {
  it('accepts files uploaded by the partner', () => {
    for (const name of ['lco9biea6ypv52xplbbo.pdf', 'a_b-1.jpg', 'x.png']) {
      expect(isOwnVerificationFile(PARTNER, `${folder(PARTNER)}/${name}`)).toBe(
        true,
      );
    }
  });

  it("rejects other partners' files and crafted ids", () => {
    for (const fileId of [
      `${folder(OTHER)}/doc.pdf`,
      `${folder(PARTNER)}/../${OTHER}/doc.pdf`,
      `${folder(PARTNER)}/sub/doc.pdf`,
      `${folder(PARTNER)}/doc.exe`,
      `${folder(PARTNER)}/`,
      `${folder(PARTNER)}doc.pdf`,
      `x/${folder(PARTNER)}/doc.pdf`,
    ]) {
      expect(isOwnVerificationFile(PARTNER, fileId)).toBe(false);
    }
  });
});
