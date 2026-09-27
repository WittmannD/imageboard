import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1790517991605 implements MigrationInterface {
  name = 'Init1790517991605';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Provides uuid_generate_v4(). The Postgres driver also installs it on
    // connect when it sees uuid entities, but the schema should not rely on that.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "username" text NOT NULL,
                "email" text NOT NULL,
                "emailVerified" boolean NOT NULL DEFAULT false,
                "passwordChangedAt" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_user_username" ON "users" ("username")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_user_email" ON "users" ("email")
        `);
    await queryRunner.query(`
            CREATE TABLE "credentials" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "passwordHash" character varying NOT NULL,
                "userId" uuid NOT NULL,
                CONSTRAINT "PK_1e38bc43be6697cdda548ad27a6" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "jwks_keys" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "kid" text NOT NULL,
                "alg" text NOT NULL,
                "encryptedJwk" text NOT NULL,
                CONSTRAINT "UQ_e3ce852f6df1aadba3556a4a25c" UNIQUE ("kid"),
                CONSTRAINT "PK_f34118b5ad5b54a309e5fd0fdd2" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "credentials"
            ADD CONSTRAINT "FK_8d3a07b8e994962efe57ebd0f20" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "credentials" DROP CONSTRAINT "FK_8d3a07b8e994962efe57ebd0f20"
        `);
    await queryRunner.query(`
            DROP TABLE "jwks_keys"
        `);
    await queryRunner.query(`
            DROP TABLE "credentials"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."UQ_user_email"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."UQ_user_username"
        `);
    await queryRunner.query(`
            DROP TABLE "users"
        `);
  }
}
