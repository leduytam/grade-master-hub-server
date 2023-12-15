import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { IsExists } from 'src/common/validators/is-exists.validator';
import { IsNotExists } from 'src/common/validators/is-not-exists.validator';
import { IAllConfig } from 'src/configs/types/config.interface';
import { MailModule } from 'src/mail/mail.module';
import { FilesModule } from 'src/models/files/files.module';
import { UserVerificationTokensModule } from 'src/models/user-verification-tokens/user-verification-tokens.module';
import { UsersModule } from 'src/models/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    IsExists,
    IsNotExists,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,
    FacebookStrategy,
  ],
  imports: [
    UsersModule,
    MailModule,
    FilesModule,
    UsersModule,
    UserVerificationTokensModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService<IAllConfig>) => ({
        secret: config.get('auth.jwtSecret', { infer: true }),
        signOptions: {
          expiresIn: config.get('auth.jwtExpires', { infer: true }),
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AuthModule {}
