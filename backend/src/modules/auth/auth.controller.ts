import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  accountResponseSchema,
  authResultResponseSchema,
  invitationResultResponseSchema,
  refreshResultResponseSchema,
  registerResultResponseSchema,
  sessionInfoResponseSchema,
  z,
} from '@stayreco/shared';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { API_PREFIX } from '../../app.setup';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import {
  ReqMeta,
  type RequestMeta,
} from '../../common/decorators/request-meta.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  ApiClientType,
  ApiData,
  ApiErrors,
} from '../../common/swagger/api-docs.decorators';
import { Env } from '../../config/env';
import { UserRole } from '../../generated/prisma/client';
import {
  AcceptInvitationDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  InviteAccountDto,
  InviteStaffDto,
  LoginDto,
  RefreshDto,
  RegisterCustomerDto,
  RegisterPartnerDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { AuthService } from './services/auth.service';
import { type TokenPair, TokenService } from './services/token.service';

const REFRESH_COOKIE = 'refresh_token';
const COOKIE_PATH = `/${API_PREFIX}/auth`;

/** Strict limits for credential-guessing and email-sending endpoints. */
const LOGIN_LIMIT = { default: { limit: 5, ttl: 60_000 } };
const EMAIL_LIMIT = { default: { limit: 3, ttl: 15 * 60_000 } };

const REGISTER_NOTE =
  'Creates a `PENDING_VERIFICATION` account and emails a 6-digit code (valid 10 minutes, 5 attempts). No tokens until `POST /auth/verify-email`.';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Public()
  @Throttle(LOGIN_LIMIT)
  @ApiOperation({ summary: 'Register a customer', description: REGISTER_NOTE })
  @ApiData(registerResultResponseSchema, HttpStatus.CREATED)
  @ApiErrors(ErrorCode.AUTH_EMAIL_TAKEN, ErrorCode.TOO_MANY_REQUESTS)
  @Post('register/customer')
  registerCustomer(
    @Body() dto: RegisterCustomerDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.auth.registerCustomer(dto, meta);
  }

  @Public()
  @Throttle(LOGIN_LIMIT)
  @ApiOperation({
    summary: 'Register a hotel partner',
    description: REGISTER_NOTE,
  })
  @ApiData(registerResultResponseSchema, HttpStatus.CREATED)
  @ApiErrors(ErrorCode.AUTH_EMAIL_TAKEN, ErrorCode.TOO_MANY_REQUESTS)
  @Post('register/partner')
  registerPartner(
    @Body() dto: RegisterPartnerDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.auth.registerPartner(dto, meta);
  }

  @Public()
  @Throttle(LOGIN_LIMIT)
  @ApiOperation({
    summary: 'Sign in with email and password',
    description:
      '5 wrong passwords lock the account for 15 minutes. Before the email code is entered the answer is 403 `AUTH_EMAIL_NOT_VERIFIED`: show the OTP screen.',
  })
  @ApiClientType()
  @ApiData(authResultResponseSchema)
  @ApiErrors(
    ErrorCode.AUTH_INVALID_CREDENTIALS,
    ErrorCode.AUTH_ACCOUNT_LOCKED,
    ErrorCode.AUTH_ACCOUNT_SUSPENDED,
    ErrorCode.AUTH_ACCOUNT_DEACTIVATED,
    ErrorCode.AUTH_EMAIL_NOT_VERIFIED,
    ErrorCode.TOO_MANY_REQUESTS,
  )
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @ReqMeta() meta: RequestMeta,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { account, tokens } = await this.auth.login(dto, meta);
    return { account, ...this.deliverTokens(req, res, tokens) };
  }

  @Public()
  @ApiOperation({
    summary: 'Get a new access token',
    description:
      'Web: send `{}`; the `refresh_token` cookie is read. Mobile: send `{ refreshToken }`. The refresh token rotates on every call, and reusing an old one revokes the session. Call it only after a 401 `UNAUTHENTICATED`.',
  })
  @ApiClientType()
  @ApiData(refreshResultResponseSchema)
  @ApiErrors(ErrorCode.AUTH_REFRESH_TOKEN_INVALID)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshDto,
    @ReqMeta() meta: RequestMeta,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token =
      dto.refreshToken ??
      (req.cookies as Record<string, string | undefined>)[REFRESH_COOKIE];
    if (!token) {
      throw new UnauthorizedException({
        code: ErrorCode.AUTH_REFRESH_TOKEN_INVALID,
        message: 'Missing refresh token',
      });
    }

    try {
      const tokens = await this.auth.refresh(token, meta);
      return this.deliverTokens(req, res, tokens);
    } catch (err) {
      this.clearRefreshCookie(res);
      throw err;
    }
  }

  @ApiOperation({
    summary: 'Sign out of this device (also clears the refresh cookie)',
  })
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: AuthUser,
    @ReqMeta() meta: RequestMeta,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(user, meta);
    this.clearRefreshCookie(res);
  }

  @ApiOperation({ summary: 'Sign out of every device' })
  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(
    @CurrentUser() user: AuthUser,
    @ReqMeta() meta: RequestMeta,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logoutAll(user, meta);
    this.clearRefreshCookie(res);
  }

  @ApiOperation({ summary: 'Get the signed-in account' })
  @ApiData(accountResponseSchema)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.accountId);
  }

  @ApiOperation({ summary: 'List the devices where I am signed in' })
  @ApiData(z.array(sessionInfoResponseSchema))
  @Get('sessions')
  sessions(@CurrentUser() user: AuthUser) {
    return this.auth.listSessions(user);
  }

  @ApiOperation({ summary: 'Sign out one of my devices' })
  @ApiErrors(ErrorCode.AUTH_SESSION_NOT_FOUND, ErrorCode.BAD_REQUEST)
  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeSession(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.auth.revokeSession(user, id, meta);
  }

  @Public()
  @Throttle(LOGIN_LIMIT)
  @ApiOperation({
    summary: 'Verify the email with the 6-digit code and sign in',
    description:
      'Activates the account and returns the same result as login. Wrong code: `AUTH_OTP_INVALID`; expired, used or 5 attempts reached: `AUTH_OTP_EXPIRED` (offer "Resend code").',
  })
  @ApiClientType()
  @ApiData(authResultResponseSchema)
  @ApiErrors(
    ErrorCode.AUTH_OTP_INVALID,
    ErrorCode.AUTH_OTP_EXPIRED,
    ErrorCode.TOO_MANY_REQUESTS,
  )
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @ReqMeta() meta: RequestMeta,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { account, tokens } = await this.auth.verifyEmail(dto, meta);
    return { account, ...this.deliverTokens(req, res, tokens) };
  }

  @Public()
  @Throttle(EMAIL_LIMIT)
  @ApiOperation({
    summary: 'Send a new email verification code',
    description:
      'Always 204, so it does not reveal which emails exist. A new code is sent only to accounts waiting for verification.',
  })
  @ApiErrors(ErrorCode.TOO_MANY_REQUESTS)
  @Post('resend-verification')
  @HttpCode(HttpStatus.NO_CONTENT)
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.auth.resendVerification(dto.email);
  }

  @Public()
  @Throttle(EMAIL_LIMIT)
  @ApiOperation({
    summary: 'Email a password reset link',
    description:
      'Always 204, so it does not reveal which emails exist. The email links to `/reset-password?token=…`, valid 15 minutes.',
  })
  @ApiErrors(ErrorCode.TOO_MANY_REQUESTS)
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Public()
  @Throttle(LOGIN_LIMIT)
  @ApiOperation({
    summary: 'Set a new password with the emailed token',
    description: 'Signs out every device of the account.',
  })
  @ApiErrors(
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.AUTH_ACCOUNT_INACTIVE,
    ErrorCode.TOO_MANY_REQUESTS,
  )
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPassword(@Body() dto: ResetPasswordDto, @ReqMeta() meta: RequestMeta) {
    return this.auth.resetPassword(dto, meta);
  }

  @ApiOperation({
    summary: 'Change my password',
    description: 'Keeps this device signed in and signs out the others.',
  })
  @ApiErrors(ErrorCode.AUTH_WRONG_PASSWORD)
  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.auth.changePassword(user, dto, meta);
  }

  @Roles(UserRole.HOTEL_PARTNER)
  @ApiOperation({
    summary: 'Invite a staff member to one of my hotels',
    description:
      'The hotel must belong to the partner. Emails a link to `/accept-invitation?token=…`, valid 72 hours. Inviting the same email again to the same hotel while it is still `INVITED` resends the invitation.',
  })
  @ApiData(invitationResultResponseSchema, HttpStatus.CREATED)
  @ApiErrors(
    ErrorCode.HOTEL_NOT_FOUND,
    ErrorCode.PARTNER_SUSPENDED,
    ErrorCode.AUTH_EMAIL_TAKEN,
  )
  @Post('invitations/staff')
  inviteStaff(
    @CurrentUser() user: AuthUser,
    @Body() dto: InviteStaffDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.auth.inviteStaff(user, dto, meta);
  }

  @ApiOperation({ summary: 'Invite a platform manager' })
  @Roles(UserRole.ADMIN)
  @ApiData(invitationResultResponseSchema, HttpStatus.CREATED)
  @ApiErrors(ErrorCode.AUTH_EMAIL_TAKEN)
  @Post('invitations/platform-manager')
  invitePlatformManager(
    @CurrentUser() user: AuthUser,
    @Body() dto: InviteAccountDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.auth.invitePlatformManager(user, dto, meta);
  }

  @ApiOperation({ summary: 'Accept an invitation: set a password and sign in' })
  @Public()
  @Throttle(LOGIN_LIMIT)
  @ApiClientType()
  @ApiData(authResultResponseSchema, HttpStatus.CREATED)
  @ApiErrors(
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.AUTH_INVITATION_ACCEPTED,
    ErrorCode.TOO_MANY_REQUESTS,
  )
  @Post('invitations/accept')
  async acceptInvitation(
    @Body() dto: AcceptInvitationDto,
    @ReqMeta() meta: RequestMeta,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { account, tokens } = await this.auth.acceptInvitation(dto, meta);
    return { account, ...this.deliverTokens(req, res, tokens) };
  }

  /**
   * Web (`X-Client-Type: web`): refresh token goes into an httpOnly cookie only.
   * Mobile / other clients: refresh token is returned in the body.
   */
  private deliverTokens(req: Request, res: Response, tokens: TokenPair) {
    if (req.headers['x-client-type'] !== 'web') return tokens;

    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV', { infer: true }) === 'production',
      sameSite: 'lax',
      path: COOKIE_PATH,
      maxAge: this.tokens.refreshTtlMs,
    });
    return { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn };
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE, { path: COOKIE_PATH });
  }
}
