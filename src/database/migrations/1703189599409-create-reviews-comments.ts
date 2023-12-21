import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReviewsComments1703189599409 implements MigrationInterface {
  name = 'CreateReviewsComments1703189599409';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "FK_f7278e9dcb3117310747ece03f8"`,
    );
    await queryRunner.query(
      `CREATE TABLE "review_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" character varying NOT NULL, "level" integer NOT NULL DEFAULT '1', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "parent_id" uuid, "user_id" uuid, "review_id" uuid, CONSTRAINT "PK_7a18556c348d381630855d05f0a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."reviews_status_enum" AS ENUM('pending', 'rejected', 'accepted')`,
    );
    await queryRunner.query(
      `CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "student_explanation" character varying NOT NULL, "student_expected_grade" integer NOT NULL, "student_current_grade" integer NOT NULL, "student_final_grade" integer, "status" "public"."reviews_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "ended_by_id" uuid, "requester_id" uuid, "grade_id" uuid, "class_entity_id" uuid, CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_comments" ADD CONSTRAINT "FK_4273cc28b4f580da698d4fa4bcf" FOREIGN KEY ("parent_id") REFERENCES "review_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_comments" ADD CONSTRAINT "FK_d00ccfa77fcc9b25fcf9b9b50c1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_comments" ADD CONSTRAINT "FK_16cc302113c3fd00d930056fa38" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_359a15ad36c6aa8c15ba1b94b1d" FOREIGN KEY ("ended_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_a140bcdd9c870703c71e62f8b28" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_37f47fd5dcaacf476bc3dc44528" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_f4d6977c3829aa917e87f37ee92" FOREIGN KEY ("class_entity_id") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "FK_f7278e9dcb3117310747ece03f8" FOREIGN KEY ("class_entity_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "FK_f7278e9dcb3117310747ece03f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_f4d6977c3829aa917e87f37ee92"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_37f47fd5dcaacf476bc3dc44528"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_a140bcdd9c870703c71e62f8b28"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_359a15ad36c6aa8c15ba1b94b1d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_comments" DROP CONSTRAINT "FK_16cc302113c3fd00d930056fa38"`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_comments" DROP CONSTRAINT "FK_d00ccfa77fcc9b25fcf9b9b50c1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_comments" DROP CONSTRAINT "FK_4273cc28b4f580da698d4fa4bcf"`,
    );
    await queryRunner.query(`DROP TABLE "reviews"`);
    await queryRunner.query(`DROP TYPE "public"."reviews_status_enum"`);
    await queryRunner.query(`DROP TABLE "review_comments"`);
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "FK_f7278e9dcb3117310747ece03f8" FOREIGN KEY ("class_entity_id") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
