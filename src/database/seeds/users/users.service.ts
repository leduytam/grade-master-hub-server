import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from 'src/models/users/entities/user.entity';
import { EUserRole } from 'src/models/users/types/user-roles.enum';
import { EUserStatus } from 'src/models/users/types/user-statuses.enum';
import { Repository } from 'typeorm';

@Injectable()
export class UsersSeedService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async run() {
    Logger.log('Seeding users...', 'Seeds');

    const count = await this.repo.count();

    if (!count) {
      const admins: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        dob: string;
        createdAt: string;
        updatedAt: string;
      }[] = [
        {
          id: '1b030113-a64a-4ee0-9138-f42ca30de515',
          firstName: 'Tâm',
          lastName: 'Lê',
          email: 'ldtam@yopmail.com',
          dob: '2002-01-01',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
        },
        {
          id: '67b5e0e4-778c-49bc-848e-635681a2b667',
          firstName: 'Nam',
          lastName: 'Hoàng',
          email: 'hqnam@yopmail.com',
          dob: '2002-01-02',
          createdAt: '2023-01-02T00:00:00.000Z',
          updatedAt: '2023-01-02T00:00:00.000Z',
        },
        {
          id: 'b1a3a1ba-0687-4e37-80a8-ec39085af239',
          firstName: 'Kiệt',
          lastName: 'Lê',
          email: 'lakiet@yopmail.com',
          dob: '2002-01-03',
          createdAt: '2023-01-02T00:00:00.000Z',
          updatedAt: '2023-01-02T00:00:00.000Z',
        },
      ];

      for (let i = 0; i < admins.length; i++) {
        const admin = this.repo.create({
          id: admins[i].id,
          firstName: admins[i].firstName,
          lastName: admins[i].lastName,
          email: admins[i].email,
          dob: new Date(admins[i].dob),
          password: 'Admin@123456',
          role: EUserRole.ADMIN,
          status: EUserStatus.ACTIVE,
          createdAt: new Date(admins[i].createdAt),
          updatedAt: new Date(admins[i].updatedAt),
        });
        await this.repo.save(admin);
      }

      const users: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        dob: string;
        createdAt: string;
        updatedAt: string;
      }[] = [
        {
          id: '7688fd1f-d1bb-4a0e-868b-6710de07c401',
          firstName: 'Kasandra',
          lastName: 'Murray',
          email: 'user1@yopmail.com',
          dob: '2001-03-07',
          createdAt: '2023-09-24T13:05:13.581Z',
          updatedAt: '2023-09-24T13:05:13.581Z',
        },
        {
          id: 'e23eaf3f-077e-4399-8158-aefb9557df59',
          firstName: 'Isadore',
          lastName: 'Beer',
          email: 'user2@yopmail.com',
          dob: '2005-01-09',
          createdAt: '2023-06-25T23:20:24.847Z',
          updatedAt: '2023-06-25T23:20:24.847Z',
        },
        {
          id: '670abec6-4faf-47fb-a09c-76bdde9cbc94',
          firstName: 'Jane',
          lastName: 'Franey',
          email: 'user3@yopmail.com',
          dob: '2002-01-27',
          createdAt: '2023-05-01T04:20:38.292Z',
          updatedAt: '2023-05-01T04:20:38.292Z',
        },
        {
          id: 'cdf303e9-9798-4a04-80d6-9c0b78989a88',
          firstName: 'Trystan',
          lastName: 'Borer',
          email: 'user4@yopmail.com',
          dob: '1999-03-15',
          createdAt: '2023-10-14T01:38:23.991Z',
          updatedAt: '2023-10-14T01:38:23.991Z',
        },
        {
          id: '18c4eab8-7be5-49ea-87df-77aa465bf581',
          firstName: 'August',
          lastName: 'Kessler',
          email: 'user5@yopmail.com',
          dob: '2002-07-20',
          createdAt: '2023-09-19T20:52:36.005Z',
          updatedAt: '2023-09-19T20:52:36.005Z',
        },
        {
          id: 'd2aa0297-9f48-4738-9050-8baa5d710eca',
          firstName: 'Dayna',
          lastName: 'Tillman',
          email: 'user6@yopmail.com',
          dob: '2004-01-31',
          createdAt: '2023-01-30T20:47:50.394Z',
          updatedAt: '2023-01-30T20:47:50.394Z',
        },
        {
          id: '0dd04079-06dc-43aa-84bd-be830c68240c',
          firstName: 'Quinn',
          lastName: 'Renner',
          email: 'user7@yopmail.com',
          dob: '1996-10-21',
          createdAt: '2022-12-27T13:24:42.078Z',
          updatedAt: '2022-12-27T13:24:42.078Z',
        },
        {
          id: 'c9665dc3-43bc-42c3-b126-8abca769ed0a',
          firstName: 'Selina',
          lastName: 'Stanton',
          email: 'user8@yopmail.com',
          dob: '2003-12-28',
          createdAt: '2023-04-12T05:19:33.722Z',
          updatedAt: '2023-04-12T05:19:33.722Z',
        },
        {
          id: '2d107a49-7e81-49be-b51a-2ecc2d3b8d75',
          firstName: 'Virgil',
          lastName: 'Gerlach',
          email: 'user9@yopmail.com',
          dob: '2001-09-03',
          createdAt: '2023-05-25T04:33:45.285Z',
          updatedAt: '2023-05-25T04:33:45.285Z',
        },
        {
          id: '5e8c88ef-78cc-4214-8d30-bf332628f256',
          firstName: 'Cordelia',
          lastName: 'Green',
          email: 'user10@yopmail.com',
          dob: '2005-12-17',
          createdAt: '2022-12-30T07:54:18.463Z',
          updatedAt: '2022-12-30T07:54:18.463Z',
        },
      ];

      for (let i = 0; i < users.length; i++) {
        const user = this.repo.create({
          id: users[i].id,
          firstName: users[i].firstName,
          lastName: users[i].lastName,
          email: users[i].email,
          dob: new Date(users[i].dob),
          password: 'User@123456',
          role: EUserRole.USER,
          status: EUserStatus.ACTIVE,
          createdAt: new Date(users[i].createdAt),
          updatedAt: new Date(users[i].updatedAt),
        });
        await this.repo.save(user);
      }

      Logger.log('Seeding users completed!', 'Seeds');
    } else {
      Logger.log('Users already seeded! Skipped!', 'Seeds');
    }
  }
}
