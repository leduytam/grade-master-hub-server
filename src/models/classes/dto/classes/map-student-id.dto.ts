import { IsString, IsUUID, Validate } from 'class-validator';
import { IsExists } from 'src/common/validators/is-exists.validator';

export class MapStudentIdDto {
  @IsString()
  studentId: string;

  @IsUUID()
  @Validate(IsExists, ['User', 'id'], {
    message: 'User not found',
  })
  userId: string;
}
