import { ApiProperty } from '@nestjs/swagger';

export class ILoginResponse {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  accessTokenExpiresIn: number;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  refreshTokenExpiresIn: number;
}
