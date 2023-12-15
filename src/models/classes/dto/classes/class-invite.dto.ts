import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, Validate } from 'class-validator';
import { IsExists } from 'src/common/validators/is-exists.validator';
import { EClassRole } from '../../types/class-roles.enum';

export class ClassInviteDto {
  @ApiProperty()
  @IsEmail()
  @Validate(IsExists, ['User'], {
    message: 'User with this email does not exist',
  })
  email: string;

  @ApiProperty()
  @IsEnum(EClassRole)
  role: EClassRole;
}
