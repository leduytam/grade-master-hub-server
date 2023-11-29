import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTokens1701276091559 implements MigrationInterface {
  name = 'CreateUsersTokens1701276091559';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "verification_tokens" ("id" integer NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_f2d4d7a2aa57ef199e61567db22" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_verification_tokens" ("user_id" uuid NOT NULL, "token_type_id" integer NOT NULL, "hash" character varying NOT NULL, "expires_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_188be5e54e16c4a058e4bd075c5" PRIMARY KEY ("user_id", "token_type_id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_provider_enum" AS ENUM('email', 'google', 'facebook')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'pending', 'blocked')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying, "password" character varying, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "dob" date, "provider" "public"."users_provider_enum" NOT NULL DEFAULT 'email', "google_id" character varying, "facebook_id" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "status" "public"."users_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "avatar_id" uuid, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "path" character varying, CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_verification_tokens" ADD CONSTRAINT "FK_0dbaa0aceff08b07a06e3a472d1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_verification_tokens" ADD CONSTRAINT "FK_b57635ce54a2933ee06fdb03885" FOREIGN KEY ("token_type_id") REFERENCES "verification_tokens"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_c3401836efedec3bec459c8f818" FOREIGN KEY ("avatar_id") REFERENCES "files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_c3401836efedec3bec459c8f818"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_verification_tokens" DROP CONSTRAINT "FK_b57635ce54a2933ee06fdb03885"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_verification_tokens" DROP CONSTRAINT "FK_0dbaa0aceff08b07a06e3a472d1"`,
    );
    await queryRunner.query(`DROP TABLE "files"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_provider_enum"`);
    await queryRunner.query(`DROP TABLE "user_verification_tokens"`);
    await queryRunner.query(`DROP TABLE "verification_tokens"`);
  }
}
