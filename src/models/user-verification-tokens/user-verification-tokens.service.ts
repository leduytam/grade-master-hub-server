import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserVerificationToken } from './entities/user-verification-token.entity';

@Injectable()
export class UserVerificationTokensService {
  constructor(
    @InjectRepository(UserVerificationToken)
    private readonly repo: Repository<UserVerificationToken>,
  ) {}

  async create(
    data: Partial<UserVerificationToken>,
  ): Promise<UserVerificationToken> {
    return this.repo.save(this.repo.create(data));
  }

  async findOne(
    userId: string,
    tokenTypeId: number,
  ): Promise<UserVerificationToken> {
    return this.repo.findOne({
      where: {
        userId,
        tokenTypeId,
      },
    });
  }

  async update(
    userId: string,
    tokenTypeId: number,
    data: Partial<UserVerificationToken>,
  ): Promise<UserVerificationToken> {
    const entity = await this.repo.findOne({
      where: {
        userId,
        tokenTypeId,
      },
    });
    Object.assign(entity, data);
    return this.repo.save(entity);
  }

  async delete(userId: string, tokenTypeId: number): Promise<void> {
    await this.repo.delete({
      userId,
      tokenTypeId,
    });
  }

  async verifyAndDelete(
    userId: string,
    tokenTypeId: number,
    hash: string,
    actionIfSuccess: () => Promise<void>,
  ): Promise<void> {
    const userVerificationToken = await this.findOne(userId, tokenTypeId);

    if (
      !userVerificationToken ||
      !(await bcrypt.compare(hash, userVerificationToken.hash)) ||
      userVerificationToken.expiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid token');
    }

    await actionIfSuccess();

    await this.delete(userId, tokenTypeId);
  }
}
