import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTravelDocumentLocationTables1762086044533
  implements MigrationInterface
{
  name = 'CreateTravelDocumentLocationTables1762086044533';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "document" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying NOT NULL, "travel_id" uuid NOT NULL, "file_id" character varying NOT NULL, "name" character varying NOT NULL, "type" character varying NOT NULL, "url" character varying, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e57d3357f83f3cdc0acffc3d777" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a24176a40152f41c98c09d8057" ON "document" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_Document_UserId_TravelId" ON "document" ("user_id", "travel_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "travel" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying NOT NULL, "name" character varying NOT NULL, "friends" jsonb NOT NULL DEFAULT '[]', "start_date" TIMESTAMP, "end_date" TIMESTAMP, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_657b63ec7adcf2ecf757a490a67" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d5aaea5c92c7d04354bdf192ef" ON "travel" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "location" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying NOT NULL, "travel_id" character varying NOT NULL, "name" character varying NOT NULL, "kind" character varying NOT NULL, "type" character varying NOT NULL, "connection" jsonb, "coordinates" jsonb NOT NULL DEFAULT '{}', "document_id" character varying, "price" jsonb, "start_date" TIMESTAMP, "end_date" TIMESTAMP, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_876d7bdba03c72251ec4c2dc827" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ba3b695bc9d4bd35cc12839507" ON "location" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_Location_UserId_TravelId_Type" ON "location" ("user_id", "travel_id", "type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_Location_UserId_TravelId_Kind" ON "location" ("user_id", "travel_id", "kind") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_Location_UserId_TravelId" ON "location" ("user_id", "travel_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "document" ADD CONSTRAINT "FK_ff1b145e1c73ded22eed33fff61" FOREIGN KEY ("travel_id") REFERENCES "travel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "document" DROP CONSTRAINT "FK_ff1b145e1c73ded22eed33fff61"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_Location_UserId_TravelId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_Location_UserId_TravelId_Kind"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_Location_UserId_TravelId_Type"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ba3b695bc9d4bd35cc12839507"`,
    );
    await queryRunner.query(`DROP TABLE "location"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d5aaea5c92c7d04354bdf192ef"`,
    );
    await queryRunner.query(`DROP TABLE "travel"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_Document_UserId_TravelId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a24176a40152f41c98c09d8057"`,
    );
    await queryRunner.query(`DROP TABLE "document"`);
  }
}
