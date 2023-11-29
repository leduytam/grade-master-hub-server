import { IsUUID } from 'class-validator';

export class UserIdParamsDto {
  @IsUUID()
  id: string;
}
