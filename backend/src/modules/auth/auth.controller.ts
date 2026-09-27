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
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import type { Request, Response } from 'express';
import { API_PREFIX } from '../../app.setup';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import {
  ReqMeta,
  type RequestMeta,
} from '../../common/decorators/request-meta.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Env } from '../../config/env';
import {
  AcceptInvitationDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  InviteAccountDto,
  LoginDto,
  RefreshDto,
  RegisterCustomerDto,
  RegisterPartnerDto,
  ResendVerificationDto,
  ResetPasswordDto,
  TokenDto,
} from './dto/auth.dto';
import { AuthService } from './services/auth.service';
import { type TokenPair, TokenService } from './services/token.service';

const REFRESH_COOKIE = 'refresh_token';
const COOKIE_PATH = `/${API_PREFIX}/auth`;

/** Strict limits for credential-guessing and email-sending endpoints. */
const LOGIN_LIMIT = { default: { limit: 5, ttl: 60_000 } };
const EMAIL_LIMIT = { default: { limit: 3, ttl: 15 * 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Public()
  @Throttle(LOGIN_LIMIT)
  @Post('register/customer')
  async registerCustomer(
    @Body() dto: RegisterCustomerDto,
    @ReqMeta() meta: RequestMeta,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { account, tokens } = await this.auth.registerCustomer(dto, meta);
    return { account, ...this.deliverTokens(req, res, tokens) };
  }

  @Public()
  @Throttle(LOGIN_LIMIT)
  @Post('register/partner')
  async registerPartner(
    @Body() dto: RegisterPartnerDto,
    @ReqMeta() meta: RequestMeta,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { account, tokens } = await this.auth.registerPartner(dto, meta);
    return { account, ...this.deliverTokens(req, res, tokens) };
  }

  @Public()
  @Throttle(LOGIN_LIMIT)
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
    if (!token) throw new UnauthorizedException('Missing refresh token');

    try {
      const tokens = await this.auth.refresh(token, meta);
      return this.deliverTokens(req, res, tokens);
    } catch (err) {
      this.clearRefreshCookie(res);
      throw err;
    }
  }

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

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.accountId);
  }

  @Get('sessions')
  sessions(@CurrentUser() user: AuthUser) {
    return this.auth.listSessions(user);
  }

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
  @Post('verify-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  verifyEmail(@Body() dto: TokenDto, @ReqMeta() meta: RequestMeta) {
    return this.auth.verifyEmail(dto.token, meta);
  }

  @Public()
  @Throttle(EMAIL_LIMIT)
  @Post('resend-verification')
  @HttpCode(HttpStatus.NO_CONTENT)
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.auth.resendVerification(dto.email);
  }

  @Public()
  @Throttle(EMAIL_LIMIT)
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Public()
  @Throttle(LOGIN_LIMIT)
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPassword(@Body() dto: ResetPasswordDto, @ReqMeta() meta: RequestMeta) {
    return this.auth.resetPassword(dto, meta);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.auth.changePassword(user, dto, meta);
  }

  @Roles(Role.HOTEL_PARTNER)
  @Post('invitations/staff')
  inviteStaff(
    @CurrentUser() user: AuthUser,
    @Body() dto: InviteAccountDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.auth.inviteStaff(user, dto, meta);
  }

  @Roles(Role.ADMIN)
  @Post('invitations/platform-manager')
  invitePlatformManager(
    @CurrentUser() user: AuthUser,
    @Body() dto: InviteAccountDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.auth.invitePlatformManager(user, dto, meta);
  }

  @Public()
  @Throttle(LOGIN_LIMIT)
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
