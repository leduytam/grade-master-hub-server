import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import ms from 'ms';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { UpdateMeDto } from 'src/auth/dto/update-me.dto';
import { IAllConfig } from 'src/configs/types/config.interface';
import { MailService } from 'src/mail/mail.service';
import { UserVerificationTokensService } from 'src/models/user-verification-tokens/user-verification-tokens.service';
import { EUserStatus } from 'src/models/users/types/user-statuses.enum';
import { UsersService } from 'src/models/users/users.service';
import { EVerificationTokenType } from 'src/models/verification-token-types/types/verification-token-types.enum';
import { User } from './../models/users/entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { IJwtPayload } from './types/jwt-payload.interface';
import { ILoginResponse } from './types/responses/login.interface';
import { IRegisterResponse } from './types/responses/register.interface';
import { IUserPayload } from './types/user-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<IAllConfig>,
    private readonly userVerificationTokensService: UserVerificationTokensService,
    private readonly mailService: MailService,
  ) {}

  async login(userPayload: IUserPayload): Promise<ILoginResponse> {
    if (!userPayload) {
      throw new UnauthorizedException();
    }

    if (userPayload.status === EUserStatus.BLOCKED) {
      throw new UnauthorizedException(
        'You are blocked by the administrator',
        'AccountBlocked',
      );
    }

    if (userPayload.status === EUserStatus.PENDING) {
      throw new UnauthorizedException(
        'Your account is pending activation.',
        'AccountPendingActivation',
      );
    }

    const payload: IJwtPayload = {
      sub: userPayload.id,
      email: userPayload.email,
      role: userPayload.role,
      status: userPayload.status,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      accessTokenExpiresIn: ms(
        this.configService.get<string>('auth.jwtExpires', {
          infer: true,
        }),
      ),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.configService.get('auth.jwtRefreshSecret', {
          infer: true,
        }),
        expiresIn: this.configService.get('auth.jwtRefreshExpires', {
          infer: true,
        }),
      }),
      refreshTokenExpiresIn: ms(
        this.configService.get<string>('auth.jwtRefreshExpires', {
          infer: true,
        }),
      ),
    };
  }

  async register(dto: RegisterDto): Promise<IRegisterResponse> {
    const user = await this.usersService.create(dto);
    await this.createVerificationTokenAndSendEmail(user);

    return {
      message: 'Registration successful. Please check your email to verify.',
    };
  }

  async refresh(userPayload: IUserPayload) {
    const user = await this.usersService.findOne({
      where: {
        id: userPayload.id,
      },
    });

    if (!user || user.status !== EUserStatus.ACTIVE) {
      throw new UnauthorizedException();
    }

    const payload: IJwtPayload = {
      sub: userPayload.id,
      email: userPayload.email,
      role: userPayload.role,
      status: userPayload.status,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      accessTokenExpiresIn: ms(
        this.configService.get('auth.jwtExpires', {
          infer: true,
        }),
      ),
    };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<IUserPayload> | null {
    const user = await this.usersService.findOne({
      where: {
        email,
      },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      return {
        email: user.email,
        id: user.id,
        role: user.role,
        status: user.status,
      };
    }

    return null;
  }

  async getMe(userId: string) {
    return this.usersService.findOne({
      where: {
        id: userId,
      },
    });
  }

  async updateMe(userId: string, body: UpdateMeDto) {
    return this.usersService.update(userId, body);
  }

  async changePassword(userId: string, body: ChangePasswordDto) {
    const user = await this.usersService.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!(await bcrypt.compare(body.oldPassword, user.password))) {
      throw new BadRequestException('Old password does not match');
    }

    await this.usersService.updateSave(userId, {
      password: body.newPassword,
    });

    this.mailService.sendChangedPasswordSuccess({
      to: user.email,
      data: {
        userName: `${user.firstName} ${user.lastName}`,
      },
    });

    return {
      message: 'Password changed successfully',
    };
  }

  async uploadMyAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{
    avatar: string;
  }> {
    return this.usersService.uploadAvatar(userId, file);
  }

  async deleteMyAvatar(userId: string) {
    return this.usersService.deleteAvatar(userId);
  }

  async resendVerificationEmail(email: string) {
    const user = await this.usersService.findOne({
      where: {
        email,
      },
    });

    if (!user || user.status !== EUserStatus.PENDING) {
      throw new BadRequestException(
        'Invalid email or email is already verified',
      );
    }

    await this.createVerificationTokenAndSendEmail(user);

    return {
      message: 'Verification email sent successfully. Please check your email.',
    };
  }

  async verifyEmail(token: string) {
    const decoded = Buffer.from(token, 'base64').toString('ascii');

    const [userId, hash] = decoded.split('|');

    if (!userId || !hash) {
      throw new BadRequestException('Invalid token');
    }

    await this.userVerificationTokensService.verifyAndDelete(
      userId,
      EVerificationTokenType.EMAIL_VERIFICATION,
      hash,
      async () => {
        await this.usersService.update(userId, {
          status: EUserStatus.ACTIVE,
        });
      },
    );

    const user = await this.usersService.findOne({
      where: {
        id: userId,
      },
    });

    this.mailService.sendVerifiedEmailSuccess({
      to: user.email,
      data: {
        userName: `${user.firstName} ${user.lastName}`,
      },
    });

    return {
      message: 'Email verified successfully',
    };
  }

  private async createVerificationTokenAndSendEmail(user: User) {
    const expiresIn = ms(
      this.configService.get('auth.verifyEmailExpires', {
        infer: true,
      }) as string,
    );

    const hash = crypto.randomBytes(32).toString('hex');

    await this.userVerificationTokensService.create({
      userId: user.id,
      tokenTypeId: EVerificationTokenType.EMAIL_VERIFICATION,
      hash,
      expiresAt: new Date(Date.now() + expiresIn),
    });

    const token = Buffer.from(`${user.id}|${hash}`).toString('base64');

    this.mailService.sendVerificationEmail({
      to: user.email,
      data: {
        userName: `${user.firstName} ${user.lastName}`,
        token,
        expiresIn,
      },
    });
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findOne({
      where: {
        email,
      },
    });

    if (user) {
      await this.createResetPasswordTokenAndSendEmail(user);
    }

    return {
      message:
        'If your email address exists in our database, you will receive a password recovery link at your email address in a few minutes.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const decoded = Buffer.from(token, 'base64').toString('ascii');

    const [userId, hash] = decoded.split('|');

    if (!userId || !hash) {
      throw new BadRequestException('Invalid token');
    }

    await this.userVerificationTokensService.verifyAndDelete(
      userId,
      EVerificationTokenType.RESET_PASSWORD,
      hash,
      async () => {
        await this.usersService.updateSave(userId, {
          password: newPassword,
        });
      },
    );

    const user = await this.usersService.findOne({
      where: {
        id: userId,
      },
    });

    this.mailService.sendChangedPasswordSuccess({
      to: user.email,
      data: {
        userName: `${user.firstName} ${user.lastName}`,
      },
    });

    return {
      message: 'Password reset successfully',
    };
  }

  private async createResetPasswordTokenAndSendEmail(user: User) {
    const expiresIn = ms(
      this.configService.get('auth.resetPasswordExpires', {
        infer: true,
      }) as string,
    );

    const hash = crypto.randomBytes(32).toString('hex');

    await this.userVerificationTokensService.create({
      userId: user.id,
      tokenTypeId: EVerificationTokenType.RESET_PASSWORD,
      hash,
      expiresAt: new Date(Date.now() + expiresIn),
    });

    const token = Buffer.from(`${user.id}|${hash}`).toString('base64');

    this.mailService.sendResetPasswordEmail({
      to: user.email,
      data: {
        userName: `${user.firstName} ${user.lastName}`,
        token,
        expiresIn,
      },
    });
  }
}
