import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Photos become media: a post's gallery holds images and videos. Renames the
 * photos table, keeping its rows (all of them images), and adds the type.
 */
export class MediaGallery1791473893146 implements MigrationInterface {
  name = 'MediaGallery1791473893146';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "photos" RENAME TO "media"
        `);
    await queryRunner.query(`
            ALTER SEQUENCE "photos_id_seq" RENAME TO "media_id_seq"
        `);
    // the names TypeORM derives from the table name
    await queryRunner.query(`
            ALTER TABLE "media" RENAME CONSTRAINT "PK_5220c45b8e32d49d767b9b3d725" TO "PK_f4e0fcac36e050de337b670d8bd"
        `);
    await queryRunner.query(`
            ALTER TABLE "media" RENAME CONSTRAINT "UQ_fe15d7fb3140547ef20940200b6" TO "UQ_72c55c2445cc0fdbd4d6fded1f0"
        `);
    await queryRunner.query(`
            ALTER TABLE "media" RENAME CONSTRAINT "FK_e2e964dde19a7a7a18355711522" TO "FK_9dcde1b1308b5f22f34b8454e28"
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."photos_status_enum" RENAME TO "media_status_enum"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."media_type_enum" AS ENUM('Image', 'Video')
        `);
    // every existing row is a photo; new rows always set the type
    await queryRunner.query(`
            ALTER TABLE "media"
            ADD "type" "public"."media_type_enum" NOT NULL DEFAULT 'Image'
        `);
    await queryRunner.query(`
            ALTER TABLE "media" ALTER COLUMN "type" DROP DEFAULT
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // videos have no place in the photos table
    await queryRunner.query(`
            DELETE FROM "media" WHERE "type" = 'Video'
        `);
    await queryRunner.query(`
            ALTER TABLE "media" DROP COLUMN "type"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."media_type_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."media_status_enum" RENAME TO "photos_status_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "media" RENAME CONSTRAINT "FK_9dcde1b1308b5f22f34b8454e28" TO "FK_e2e964dde19a7a7a18355711522"
        `);
    await queryRunner.query(`
            ALTER TABLE "media" RENAME CONSTRAINT "UQ_72c55c2445cc0fdbd4d6fded1f0" TO "UQ_fe15d7fb3140547ef20940200b6"
        `);
    await queryRunner.query(`
            ALTER TABLE "media" RENAME CONSTRAINT "PK_f4e0fcac36e050de337b670d8bd" TO "PK_5220c45b8e32d49d767b9b3d725"
        `);
    await queryRunner.query(`
            ALTER SEQUENCE "media_id_seq" RENAME TO "photos_id_seq"
        `);
    await queryRunner.query(`
            ALTER TABLE "media" RENAME TO "photos"
        `);
  }
}
