import { refreshCookieOptions } from './auth.controller';

describe('refreshCookieOptions', () => {
  it('lets the browser send the cookie cross-site in production, which requires Secure', () => {
    expect(refreshCookieOptions(true)).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/api/v1/auth',
    });
  });

  it('stays Lax without Secure elsewhere, where web and API share localhost over HTTP', () => {
    expect(refreshCookieOptions(false)).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/api/v1/auth',
    });
  });
});
