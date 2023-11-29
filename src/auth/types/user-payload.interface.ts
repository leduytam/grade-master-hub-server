import { User } from '../../models/users/entities/user.entity';

export interface IUserPayload {
  id: User['id'];
  email: User['email'];
  role: User['role'];
  status: User['status'];
}
