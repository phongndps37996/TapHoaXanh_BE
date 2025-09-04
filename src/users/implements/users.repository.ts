import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Users } from '../entities/users.entity';
import { IUsersRepository } from '../interfaces/iusers-repository.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterUserDto } from '../dto/filter-user.dto';
import { PaginationResult } from '../../interface/IPagination';
import { TUserRole } from '../../types/common.enum';

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) {}
  async findAll(): Promise<Users[]> {
    return this.usersRepository.find();
  }
  async findById(id: number): Promise<Users | null> {
    return this.usersRepository.findOneBy({ id });
  }
  async findByEmail(email: string): Promise<Users | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async createUser(userData: Partial<Users>): Promise<Users> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async updatePassword(email: string, newHashedPassword: string): Promise<void> {
    await this.usersRepository.update({ email }, { password: newHashedPassword });
  }
  async updateUser(id: number, userData: Partial<Users>): Promise<Users | null> {
    await this.usersRepository.update({ id }, userData);
    return await this.findById(id);
  }

  async filterUser(query: FilterUserDto): Promise<PaginationResult<Users>> {
    const { search, role, page = 1, limit = 10 } = query;
    const qb = this.usersRepository.createQueryBuilder('user');

    if (search) {
      qb.andWhere('(LOWER(user.name) LIKE LOWER(:search)) or (LOWER(user.email) LIKE LOWER(:search))', {
        search: `%${search}%`,
      });
    }

    if (role) {
      qb.andWhere('(LOWER(user.role) LIKE LOWER(:role))', {
        role: `%${role}%`,
      });
    }

    qb.orderBy('user.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async updateAvatar(id: number, imageUrl: string): Promise<Users | null> {
    await this.usersRepository.update({ id }, { image: imageUrl });
    return await this.findById(id);
  }
  async countNumberOfUser(): Promise<number> {
    const total = await this.usersRepository.count({
      where: { role: TUserRole.USER },
    });
    return total;
  }

  async updateEmailVerification(id: number, isVerified: boolean): Promise<void> {
    await this.usersRepository.update({ id }, { isEmailVerified: isVerified });
  }
}
