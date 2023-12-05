import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { IAllConfig } from 'src/configs/types/config.interface';
import { FilesService } from 'src/models/files/files.service';
import { EUserProvider } from 'src/models/users/types/user-providers.enum';
import { EUserRole } from 'src/models/users/types/user-roles.enum';
import { EUserStatus } from 'src/models/users/types/user-statuses.enum';
import { UsersService } from 'src/models/users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService<IAllConfig>,
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
  ) {
    super({
      clientID: configService.get('auth.google.clientId', {
        infer: true,
      }),
      clientSecret: configService.get('auth.google.clientSecret', {
        infer: true,
      }),
      callbackURL: `${configService.get('app.serverUrl', {
        infer: true,
      })}/v1/auth/google/callback`,
      scope: ['email', 'profile', 'openid'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    cb: VerifyCallback,
  ) {
    const { id, name, emails, photos } = profile;
    const user = await this.usersService.findOneByEmail(emails[0].value);

    if (!user) {
      const avatar = await this.filesService.create(photos[0].value);

      const newUser = await this.usersService.create({
        firstName: name.givenName,
        lastName: name.familyName,
        email: emails[0].value,
        avatar,
        googleId: id,
        provider: EUserProvider.GOOGLE,
        role: EUserRole.USER,
        status: EUserStatus.ACTIVE,
      });

      cb(null, {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      });
    } else {
      console.log(user);

      if (!user.googleId) {
        cb(null, {
          id: '',
          email: '',
          role: EUserRole.USER,
          status: EUserStatus.ACTIVE,
          error: {
            message: 'You have already used another provider',
            statusCode: HttpStatus.FORBIDDEN,
          },
        });
      } else {
        cb(null, {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
        });
      }
    }
  }
}
