import { IsEnum } from 'class-validator';
import { EClassInviteExpiresIn } from '../../types/class-invite-expires-in.enum';
import { EClassRole } from '../../types/class-roles.enum';

export class CreateInviteTokenDto {
  @IsEnum(EClassInviteExpiresIn)
  expiresIn: EClassInviteExpiresIn;

  @IsEnum(EClassRole)
  role: EClassRole;
}
