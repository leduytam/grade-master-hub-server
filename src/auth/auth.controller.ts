import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  SerializeOptions,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { UpdateMeDto } from 'src/auth/dto/update-me.dto';
import { IAllConfig } from 'src/configs/types/config.interface';
import { EUserGroup } from 'src/models/users/types/user-groups.enum';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResendVerificationEmailDto } from './dto/resend-verification-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { FacebookOAuthGuard } from './guards/facebook-oauth.guard';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { JwtGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshJwtGuard } from './guards/refresh-jwt-auth.guard';
import { ILoginResponse } from './types/responses/login.interface';
import { IRefreshResponse } from './types/responses/refresh.interface';
import { IRegisterResponse } from './types/responses/register.interface';

@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<IAllConfig>,
  ) {}

  @Post(['login'])
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBody({
    type: LoginDto,
  })
  @ApiOkResponse({
    type: ILoginResponse,
  })
  async login(@Req() req: Request): Promise<ILoginResponse> {
    return this.authService.login(req.user);
  }

  @Get('login/google')
  @UseGuards(GoogleOAuthGuard)
  async loginWithGoogle() {}

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async loginGoogleCallback(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.login(req.user);

    console.log(result);

    res.redirect(
      `${this.configService.get('app.clientUrl', {
        infer: true,
      })}/auth/login/social/success?result=${JSON.stringify(result)}`,
    );
  }

  @Get('login/facebook')
  @UseGuards(FacebookOAuthGuard)
  async loginWithFacebook() {}

  @Get('facebook/callback')
  @UseGuards(FacebookOAuthGuard)
  async loginFacebookCallback(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.login(req.user);

    res.redirect(
      `${this.configService.get('app.clientUrl', {
        infer: true,
      })}/auth/login/social/success?result=${JSON.stringify(result)}`,
    );
  }

  @Post('register')
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: IRegisterResponse,
  })
  async register(
    @Body() createUserDto: RegisterDto,
  ): Promise<IRegisterResponse> {
    return this.authService.register(createUserDto);
  }

  @Post('refresh')
  @ApiBearerAuth()
  @ApiOkResponse({
    type: IRefreshResponse,
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshJwtGuard)
  async refresh(@Req() req: Request) {
    return this.authService.refresh(req.user);
  }

  @Get('me')
  @SerializeOptions({
    groups: [EUserGroup.ME],
  })
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  async me(@Req() req: Request) {
    return this.authService.getMe(req.user.id);
  }

  @Patch('me')
  @SerializeOptions({
    groups: [EUserGroup.ME],
  })
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  async updateMe(@Req() req: Request, @Body() body: UpdateMeDto) {
    return this.authService.updateMe(req.user.id, body);
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  async changePassword(@Req() req: Request, @Body() body: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, body);
  }

  @Post('me/avatar')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.authService.uploadMyAvatar(req.user.id, file);
  }

  @Delete('me/avatar')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  async deleteAvatar(@Req() req: Request) {
    return this.authService.deleteMyAvatar(req.user.id);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('resend-verification-email')
  async resendVerificationEmail(@Body() dto: ResendVerificationEmailDto) {
    return this.authService.resendVerificationEmail(dto.email);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
