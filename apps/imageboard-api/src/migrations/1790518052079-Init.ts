import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1790518052079 implements MigrationInterface {
  name = 'Init1790518052079';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."photos_status_enum" AS ENUM('Pending', 'Processing', 'Failed', 'Ready')
        `);
    await queryRunner.query(`
            CREATE TABLE "photos" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "uploadUuid" character varying NOT NULL,
                "key" character varying NOT NULL,
                "sourceSet" jsonb NOT NULL DEFAULT '[]',
                "status" "public"."photos_status_enum" NOT NULL DEFAULT 'Pending',
                "postId" integer NOT NULL,
                CONSTRAINT "UQ_fe15d7fb3140547ef20940200b6" UNIQUE ("uploadUuid"),
                CONSTRAINT "PK_5220c45b8e32d49d767b9b3d725" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."posts_status_enum" AS ENUM('Draft', 'Published', 'Unpublished')
        `);
    await queryRunner.query(`
            CREATE TABLE "posts" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "caption" text,
                "status" "public"."posts_status_enum" NOT NULL DEFAULT 'Draft',
                "likesCount" integer NOT NULL DEFAULT '0',
                "userId" integer NOT NULL,
                CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "federated_credentials" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "issuer" text NOT NULL,
                "subject" text NOT NULL,
                "userId" integer NOT NULL,
                CONSTRAINT "issuer_subject_unique_constraint" UNIQUE ("issuer", "subject"),
                CONSTRAINT "PK_501998c0f03c831ecc9b16a1976" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "username" text NOT NULL,
                "avatars" jsonb NOT NULL DEFAULT '[]',
                "email" text NOT NULL,
                CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "likes" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "userId" integer NOT NULL,
                "postId" integer NOT NULL,
                CONSTRAINT "UQ_74b9b8cd79a1014e50135f266fe" UNIQUE ("userId", "postId"),
                CONSTRAINT "PK_a9323de3f8bced7539a794b4a37" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "photos"
            ADD CONSTRAINT "FK_e2e964dde19a7a7a18355711522" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "posts"
            ADD CONSTRAINT "FK_ae05faaa55c866130abef6e1fee" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "federated_credentials"
            ADD CONSTRAINT "FK_c6fd37ce4b2ed644db43c933d73" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "likes"
            ADD CONSTRAINT "FK_cfd8e81fac09d7339a32e57d904" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "likes"
            ADD CONSTRAINT "FK_e2fe567ad8d305fefc918d44f50" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            CREATE VIEW "user_stats" AS
            SELECT "user"."id" AS "userId",
                COALESCE(posts."postsCount", 0)::int AS "postsCount",
                COALESCE(likes."likesReceived", 0)::int AS "likesReceived"
            FROM "users" "user"
                LEFT JOIN (
                    (
                        SELECT "post"."userId" AS "userId",
                            COUNT(*) AS "postsCount"
                        FROM "posts" "post"
                        WHERE ("post"."status" = 'Published')
                            AND ("post"."deletedAt" IS NULL)
                        GROUP BY "post"."userId"
                    )
                ) "posts" ON posts."userId" = "user"."id"
                LEFT JOIN (
                    (
                        SELECT "post"."userId" AS "userId",
                            COUNT(*) AS "likesReceived"
                        FROM "likes" "like"
                            INNER JOIN "posts" "post" ON "post"."id" = "like"."postId"
                            AND "post"."deletedAt" IS NULL
                        WHERE ("post"."status" = 'Published')
                            AND ("like"."deletedAt" IS NULL)
                        GROUP BY "post"."userId"
                    )
                ) "likes" ON likes."userId" = "user"."id"
            WHERE "user"."deletedAt" IS NULL
        `);
    await queryRunner.query(
      `
            INSERT INTO "typeorm_metadata"(
                    "database",
                    "schema",
                    "table",
                    "type",
                    "name",
                    "value"
                )
            VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)
        `,
      [
        'public',
        'VIEW',
        'user_stats',
        'SELECT "user"."id" AS "userId", COALESCE(posts."postsCount", 0)::int AS "postsCount", COALESCE(likes."likesReceived", 0)::int AS "likesReceived" FROM "users" "user" LEFT JOIN ((SELECT "post"."userId" AS "userId", COUNT(*) AS "postsCount" FROM "posts" "post" WHERE ( "post"."status" = \'Published\' ) AND ( "post"."deletedAt" IS NULL ) GROUP BY "post"."userId")) "posts" ON posts."userId" = "user"."id"  LEFT JOIN ((SELECT "post"."userId" AS "userId", COUNT(*) AS "likesReceived" FROM "likes" "like" INNER JOIN "posts" "post" ON  "post"."id" = "like"."postId" AND "post"."deletedAt" IS NULL WHERE ( "post"."status" = \'Published\' ) AND ( "like"."deletedAt" IS NULL ) GROUP BY "post"."userId")) "likes" ON likes."userId" = "user"."id" WHERE "user"."deletedAt" IS NULL',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
            DELETE FROM "typeorm_metadata"
            WHERE "type" = $1
                AND "name" = $2
                AND "schema" = $3
        `,
      ['VIEW', 'user_stats', 'public'],
    );
    await queryRunner.query(`
            DROP VIEW "user_stats"
        `);
    await queryRunner.query(`
            ALTER TABLE "likes" DROP CONSTRAINT "FK_e2fe567ad8d305fefc918d44f50"
        `);
    await queryRunner.query(`
            ALTER TABLE "likes" DROP CONSTRAINT "FK_cfd8e81fac09d7339a32e57d904"
        `);
    await queryRunner.query(`
            ALTER TABLE "federated_credentials" DROP CONSTRAINT "FK_c6fd37ce4b2ed644db43c933d73"
        `);
    await queryRunner.query(`
            ALTER TABLE "posts" DROP CONSTRAINT "FK_ae05faaa55c866130abef6e1fee"
        `);
    await queryRunner.query(`
            ALTER TABLE "photos" DROP CONSTRAINT "FK_e2e964dde19a7a7a18355711522"
        `);
    await queryRunner.query(`
            DROP TABLE "likes"
        `);
    await queryRunner.query(`
            DROP TABLE "users"
        `);
    await queryRunner.query(`
            DROP TABLE "federated_credentials"
        `);
    await queryRunner.query(`
            DROP TABLE "posts"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."posts_status_enum"
        `);
    await queryRunner.query(`
            DROP TABLE "photos"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."photos_status_enum"
        `);
  }
}
