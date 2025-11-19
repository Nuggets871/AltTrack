import { UserRole } from './user-role.enum';

export interface RegisterResponse {
  id: string;
  username: string;
  role: UserRole;
  createdAt: Date;
}

