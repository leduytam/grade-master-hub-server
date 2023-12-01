import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IAllConfig } from 'src/configs/types/config.interface';
import { IJwtPayload } from '../types/jwt-payload.interface';
import { IUserPayload } from '../types/user-payload.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly configService: ConfigService<IAllConfig>) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh'),
      secretOrKey: configService.get('auth.jwtRefreshSecret', { infer: true }),
    });
  }

  validate(payload: IJwtPayload): IUserPayload {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      status: payload.status,
    };
  }
}
