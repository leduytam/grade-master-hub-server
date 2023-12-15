import { IsUUID, Validate } from 'class-validator';
import { IsExists } from 'src/common/validators/is-exists.validator';

export class UnmapStudentIdDto {
  @IsUUID()
  @Validate(IsExists, ['User', 'id'], {
    message: 'User not found',
  })
  userId: string;
}
