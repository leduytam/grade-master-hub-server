import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';
import { IAllConfig } from 'src/configs/types/config.interface';
import { FilesService } from 'src/models/files/files.service';
import { EUserProvider } from 'src/models/users/types/user-providers.enum';
import { EUserRole } from 'src/models/users/types/user-roles.enum';
import { EUserStatus } from 'src/models/users/types/user-statuses.enum';
import { UsersService } from 'src/models/users/users.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private readonly configService: ConfigService<IAllConfig>,
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
  ) {
    super({
      clientID: configService.get('auth.facebook.clientId', {
        infer: true,
      }),
      clientSecret: configService.get('auth.facebook.clientSecret', {
        infer: true,
      }),
      callbackURL: `${configService.get('app.serverUrl', {
        infer: true,
      })}/v1/auth/facebook/callback`,
      scope: ['email', 'public_profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    cb: (error: any, user?: any, info?: any) => void,
  ) {
    const { id, displayName } = profile;
    const user = await this.usersService.findOne({
      where: {
        facebookId: id,
      },
    });

    if (!user) {
      const nameWords = displayName.split(' ');

      const newUser = await this.usersService.create({
        firstName: nameWords[0],
        lastName: displayName.split(' ')[nameWords.length - 1],
        facebookId: id,
        provider: EUserProvider.FACEBOOK,
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
      if (!user.facebookId) {
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
