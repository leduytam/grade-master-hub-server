import { EUserRole } from 'src/models/users/types/user-roles.enum';
import { EUserStatus } from 'src/models/users/types/user-statuses.enum';

export interface IUserPayload {
  id: string;
  email: string;
  role: EUserRole;
  status: EUserStatus;
}
