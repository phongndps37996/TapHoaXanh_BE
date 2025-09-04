import { PaginationResult } from '../../interface/IPagination';
import { FilterUserDto } from '../dto/filter-user.dto';
import { Users } from '../entities/users.entity';

export abstract class IUsersRepository {
  findAll(): Users[] | PromiseLike<Users[]> {
    throw new Error('Method not implemented.');
  }
  abstract findById(id: number): Promise<Users | null>;
  abstract findByEmail(email: string): Promise<Users | null>;
  abstract createUser(userData: Partial<Users>): Promise<Users>;
  abstract updatePassword(email: string, newHashedPassword: string): Promise<void>;
  abstract updateUser(id: number, userData: Partial<Users>): Promise<Users | null>;
  abstract filterUser(userData: FilterUserDto): Promise<PaginationResult<Users>>;
  abstract updateAvatar(id: number, imageUrl: string): Promise<Users | null>;
  abstract countNumberOfUser(): Promise<number>;
  abstract updateEmailVerification(id: number, isVerified: boolean): Promise<void>;
}
