import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VerificationTokenType } from 'src/models/verification-token-types/entities/verification-token-type.entity';
import { EVerificationTokenType } from 'src/models/verification-token-types/types/verification-token-types.enum';

import { Repository } from 'typeorm';

@Injectable()
export class VerificationTokenTypesSeedService {
  constructor(
    @InjectRepository(VerificationTokenType)
    private readonly repo: Repository<VerificationTokenType>,
  ) {}

  async run() {
    Logger.log('Seeding verification token types...', 'Seeds');

    const count = await this.repo.count();

    if (!count) {
      const verificationTokenTypes: VerificationTokenType[] = Object.keys(
        EVerificationTokenType,
      )
        .filter((key) => isNaN(Number(key)))
        .map((key) =>
          this.repo.create({
            id: EVerificationTokenType[key] as number,
            name: key,
          }),
        );

      await this.repo.insert(verificationTokenTypes);

      Logger.log('Seeding verification token types completed!', 'Seeds');
    } else {
      Logger.log('Verification token types already seeded! Skipped!', 'Seeds');
    }
  }
}
