import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IAllConfig } from 'src/configs/types/config.interface';
import { EUserStatus } from 'src/models/users/types/user-statuses.enum';
import { UsersService } from 'src/models/users/users.service';
import { IJwtPayload } from '../types/jwt-payload.interface';
import { IUserPayload } from '../types/user-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService<IAllConfig>,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('auth.jwtSecret', { infer: true }),
    });
  }

  public async validate(payload: IJwtPayload): Promise<IUserPayload> {
    const user = await this.usersService.findOne({
      where: {
        id: payload.sub,
      },
    });

    if (!user || user.status !== EUserStatus.ACTIVE) {
      throw new UnauthorizedException();
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      status: payload.status,
    };
  }
}
