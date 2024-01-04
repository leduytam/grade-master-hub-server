import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClassIdToStudentTable1704395738227
  implements MigrationInterface
{
  name = 'AddClassIdToStudentTable1704395738227';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "grades" DROP CONSTRAINT "FK_9acca493883cee3b9e8f9e01cd1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ADD "student_class_entity_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "PK_7d7f07271ad4ce999880713f05e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "PK_dff046626f79497b08ea1505091" PRIMARY KEY ("id", "class_entity_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "FK_f7278e9dcb3117310747ece03f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ALTER COLUMN "class_entity_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "FK_f7278e9dcb3117310747ece03f8" FOREIGN KEY ("class_entity_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ADD CONSTRAINT "FK_0ee8198fa7bac6a28be94ce24cd" FOREIGN KEY ("student_id", "student_class_entity_id") REFERENCES "students"("id","class_entity_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "grades" DROP CONSTRAINT "FK_0ee8198fa7bac6a28be94ce24cd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "FK_f7278e9dcb3117310747ece03f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ALTER COLUMN "class_entity_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "FK_f7278e9dcb3117310747ece03f8" FOREIGN KEY ("class_entity_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "PK_dff046626f79497b08ea1505091"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "PK_7d7f07271ad4ce999880713f05e" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" DROP COLUMN "student_class_entity_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ADD CONSTRAINT "FK_9acca493883cee3b9e8f9e01cd1" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
