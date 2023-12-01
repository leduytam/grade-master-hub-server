import { ApiProperty } from '@nestjs/swagger';

export class IRegisterResponse {
  @ApiProperty()
  message: string;
}
