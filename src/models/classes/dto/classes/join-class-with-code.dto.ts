import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class JoinClassWithCodeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;
}
