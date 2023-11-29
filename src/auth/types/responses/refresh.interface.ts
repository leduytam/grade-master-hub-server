import { ApiProperty } from '@nestjs/swagger';

export class IRefreshResponse {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  accessTokenExpiresIn: number;
}
