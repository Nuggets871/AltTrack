import { User } from './user.model';

export interface LoginResponse {
  accessToken: string;
  user: User;
}

