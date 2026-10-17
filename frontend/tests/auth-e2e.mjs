import { chromium } from 'playwright';
import pg from '../../backend/node_modules/pg/lib/index.js';
import crypto from 'crypto';

const { Client } = pg;
const dbClient = new Client({
  connectionString: 'postgresql://stayreco:stayreco@localhost:5432/stayreco?schema=public',
});

const BASE_URL = 'http://localhost:3001';
const TIMESTAMP = Date.now();
const TEST_EMAIL = `testuser_${TIMESTAMP}@example.com`;
const PASSWORD = 'Password123';
const NEW_PASSWORD = 'NewPassword456';
const FULL_NAME = `Test User ${TIMESTAMP}`;

async function runTests() {
  console.log('🚀 Bắt đầu chạy Playwright E2E Test cho toàn bộ tính năng Auth mới...');
  console.log(`- Base URL: ${BASE_URL}`);
  console.log(`- Test Email: ${TEST_EMAIL}`);

  await dbClient.connect();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let testPassed = 0;
  let testTotal = 0;

  function assert(condition, testName) {
    testTotal++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      testPassed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  try {
    // ─────────────────────────────────────────────────────────────
    // TEST 1: ĐĂNG KÝ TÀI KHOẢN MỚI (/register)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 1. Kiểm thử luồng Đăng ký (/register) ---');
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('domcontentloaded');

    await page.fill('#fullName', FULL_NAME);
    await page.fill('#email', TEST_EMAIL);
    await page.fill('#phone', '0912345678');
    await page.fill('#password', PASSWORD);
    await page.fill('#confirmPassword', PASSWORD);
    // Base UI renders the real input as a hidden element; click the visible checkbox control.
    await page.locator('[data-slot="checkbox"]').first().click();

    // Click submit button
    await page.locator('button[type="submit"]').click();

    // Registration now opens the OTP step (no tokens until the code is verified).
    await page.waitForSelector('text=Nhập mã xác thực', { timeout: 10000 });
    const otpEmail = await page.locator(`text=${TEST_EMAIL}`).isVisible();
    assert(otpEmail, 'Sau đăng ký hiển thị màn nhập OTP với đúng email đăng ký');

    const otpSlotCount = await page.locator('[data-slot="input-otp-slot"]').count();
    assert(otpSlotCount === 6, 'Màn OTP có đủ 6 ô nhập mã');

    const resendBtn = await page.locator('button:has-text("Gửi lại mã sau")').isVisible();
    assert(resendBtn, 'Nút gửi lại mã với bộ đếm ngược hiển thị chính xác');

    // ─────────────────────────────────────────────────────────────
    // TEST 2: XÁC THỰC EMAIL BẰNG OTP (/verify-email?email=)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 2. Kiểm thử luồng Xác thực Email OTP ---');

    // 2.1 A correct password on an unverified account redirects to the OTP screen.
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');
    await page.fill('#email', TEST_EMAIL);
    await page.fill('#password', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/verify-email\?email=/, { timeout: 15000 });
    assert(
      page.url().includes('/verify-email?email='),
      'Đăng nhập khi email chưa xác thực sẽ được chuyển sang màn nhập OTP',
    );

    // 2.2 Wrong code shows an error and lets the user retry.
    await page.locator('input[autocomplete="one-time-code"]').fill('000000');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Mã xác thực không đúng', { timeout: 10000 });
    assert(true, 'Mã OTP sai hiển thị thông báo lỗi và cho phép thử lại');

    // 2.3 Find the account and confirm it is still pending verification.
    const userRes = await dbClient.query(
      'SELECT user_account_id, email_verified_at FROM user_account WHERE email = $1',
      [TEST_EMAIL.toLowerCase()],
    );
    const user = userRes.rows[0];
    assert(!!user, 'Tài khoản đã được tạo trong Database');
    assert(
      !user.email_verified_at,
      'Tài khoản vẫn ở trạng thái chưa xác thực email trước khi nhập đúng OTP',
    );

    // 2.4 Behind the console-only mailer we cannot read the mailed code, so seed a known OTP
    //     the same way the backend stores it: sha256("<tokenId>:<code>").
    await dbClient.query(
      `UPDATE verification_token SET used_at = NOW()
       WHERE user_account_id = $1 AND type = 'EMAIL_VERIFY' AND used_at IS NULL`,
      [user.user_account_id],
    );
    const otpCode = '135790';
    const otpTokenId = crypto.randomUUID();
    const otpHash = crypto
      .createHash('sha256')
      .update(`${otpTokenId}:${otpCode}`)
      .digest('hex');
    await dbClient.query(
      `INSERT INTO verification_token (verification_token_id, user_account_id, type, token_hash, expires_at, attempt_count, created_at)
       VALUES ($1, $2, 'EMAIL_VERIFY', $3, NOW() + INTERVAL '10 minutes', 0, NOW())`,
      [otpTokenId, user.user_account_id, otpHash],
    );

    // Reload the OTP screen so the input starts empty (the wrong-code attempt left "000000").
    await page.goto(`${BASE_URL}/verify-email?email=${encodeURIComponent(TEST_EMAIL)}`);
    await page.waitForSelector('text=Nhập mã xác thực', { timeout: 10000 });
    await page.locator('input[autocomplete="one-time-code"]').fill(otpCode);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname === '/', { timeout: 15000 });
    assert(true, 'Nhập đúng OTP kích hoạt tài khoản và tự động đăng nhập (về trang chủ /)');
    const updatedUserRes = await dbClient.query(
      'SELECT email_verified_at FROM user_account WHERE email = $1',
      [TEST_EMAIL.toLowerCase()],
    );
    assert(
      !!updatedUserRes.rows[0].email_verified_at,
      'Database ghi nhận email_verified_at thành công',
    );

    // ─────────────────────────────────────────────────────────────
    // TEST 3: ĐĂNG NHẬP (/login)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 3. Kiểm thử luồng Đăng nhập (/login) ---');

    // 3.1 Test Wrong Password
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    await page.fill('#email', TEST_EMAIL);
    await page.fill('#password', 'WrongPassword999');
    await page.click('button[type="submit"]');

    await page.waitForSelector('text=Email hoặc mật khẩu không chính xác.', { timeout: 10000 });
    assert(true, 'Báo lỗi chính xác khi nhập sai thông tin đăng nhập');

    // 3.2 Test Successful Login
    await page.fill('#password', PASSWORD);
    await page.click('button[type="submit"]');

    // Customer without a `next` param lands on the home page.
    await page.waitForURL((url) => url.pathname === '/', { timeout: 15000 });
    assert(new URL(page.url()).pathname === '/', 'Đăng nhập thành công và customer được đưa về trang chủ /');

    // ─────────────────────────────────────────────────────────────
    // TEST 4: HỒ SƠ CÁ NHÂN (/account/profile)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 4. Kiểm thử giao diện Hồ sơ (/account/profile) ---');
    await page.goto(`${BASE_URL}/account/profile`);
    await page.waitForSelector('text=Hồ sơ cá nhân', { timeout: 10000 });

    // Verify email verified badge is "Đã xác thực"
    const verifiedBadge = await page.locator('span:text-is("Đã xác thực")').first().isVisible();
    assert(verifiedBadge, 'Badge Email hiển thị đúng trạng thái "Đã xác thực" từ user thật');

    // Verify "Đã xác thực OTP" fake badge for phone is REMOVED
    const fakeOtpBadge = await page.locator('text="Đã xác thực OTP"').isVisible();
    assert(!fakeOtpBadge, 'Đã loại bỏ hoàn toàn badge hiển thị mẫu "Đã xác thực OTP" ở số điện thoại');

    // ─────────────────────────────────────────────────────────────
    // TEST 5: QUÊN MẬT KHẨU (/forgot-password)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 5. Kiểm thử luồng Quên mật khẩu (/forgot-password) ---');
    await page.goto(`${BASE_URL}/forgot-password`);
    await page.waitForLoadState('domcontentloaded');

    await page.fill('#email', TEST_EMAIL);
    await page.click('button[type="submit"]');

    await page.waitForSelector('text=Kiểm tra hộp thư của bạn', { timeout: 10000 });
    const forgotSuccessEmail = await page.locator(`text=${TEST_EMAIL}`).isVisible();
    assert(forgotSuccessEmail, 'Gửi yêu cầu đặt lại mật khẩu thành công và hiển thị email thông báo');

    // ─────────────────────────────────────────────────────────────
    // TEST 6: ĐẶT LẠI MẬT KHẨU (/reset-password)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 6. Kiểm thử luồng Đặt lại mật khẩu (/reset-password) ---');

    // 6.1 Test without token
    await page.goto(`${BASE_URL}/reset-password`);
    await page.waitForSelector('text=Liên kết không hợp lệ', { timeout: 10000 });
    assert(true, 'Truy cập /reset-password không có token hiển thị thông báo lỗi');

    // 6.2 Test with valid token
    const rawResetToken = crypto.randomBytes(48).toString('base64url');
    const resetTokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');

    await dbClient.query(
      `INSERT INTO verification_token (verification_token_id, user_account_id, type, token_hash, expires_at, created_at)
       VALUES (gen_random_uuid(), $1, 'PASSWORD_RESET', $2, NOW() + INTERVAL '30 minutes', NOW())`,
      [user.user_account_id, resetTokenHash],
    );

    await page.goto(`${BASE_URL}/reset-password?token=${rawResetToken}`);
    await page.waitForSelector('#newPassword', { timeout: 10000 });

    await page.fill('#newPassword', NEW_PASSWORD);
    await page.fill('#confirmPassword', NEW_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForSelector('text=Đặt lại mật khẩu thành công!', { timeout: 10000 });
    assert(true, 'Đặt lại mật khẩu mới qua /reset-password thành công');

    // ─────────────────────────────────────────────────────────────
    // TEST 7: ĐĂNG NHẬP LẠI VỚI MẬT KHẨU MỚI
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 7. Đăng nhập lại với mật khẩu mới vừa đổi ---');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    // Login with old password should fail
    await page.fill('#email', TEST_EMAIL);
    await page.fill('#password', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Email hoặc mật khẩu không chính xác.', { timeout: 10000 });
    assert(true, 'Mật khẩu cũ không còn đăng nhập được');

    // Login with new password should succeed
    await page.fill('#password', NEW_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname === '/', { timeout: 15000 });
    assert(new URL(page.url()).pathname === '/', 'Đăng nhập thành công với mật khẩu mới');

    console.log(`\n🎉 TOÀN BỘ ${testPassed}/${testTotal} BÀI TEST E2E ĐÃ VƯỢT QUA XUẤT SẮC 100%!`);
  } catch (error) {
    console.error('\n❌ Có lỗi xảy ra trong quá trình test:', error);
    process.exitCode = 1;
  } finally {
    await browser.close();
    await dbClient.end();
  }
}

runTests();
