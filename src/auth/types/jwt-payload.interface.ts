import { EUserRole } from 'src/models/users/types/user-roles.enum';
import { EUserStatus } from 'src/models/users/types/user-statuses.enum';

export interface IJwtPayload {
  sub: string;
  email: string;
  role: EUserRole;
  status: EUserStatus;
}
