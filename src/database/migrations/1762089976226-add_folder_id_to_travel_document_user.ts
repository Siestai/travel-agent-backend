import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFolderIdToTravelDocumentUser1762089976226
  implements MigrationInterface
{
  name = 'AddFolderIdToTravelDocumentUser1762089976226';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "drive_root_folder_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "document" ADD "drive_folder_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "travel" ADD "drive_folder_id" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "travel" DROP COLUMN "drive_folder_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document" DROP COLUMN "drive_folder_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "drive_root_folder_id"`,
    );
  }
}
