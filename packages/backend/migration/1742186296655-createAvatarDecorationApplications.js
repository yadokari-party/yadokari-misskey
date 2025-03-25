/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class CreateAvatarDecorationApplications1742186296655 {
    name = 'CreateAvatarDecorationApplications1742186296655'

    async up(queryRunner) {
			await queryRunner.query(`CREATE TYPE "avatar_decoration_application_status_enum" AS ENUM('pending', 'canceled', 'rejected', 'accepted')`);
			queryRunner.query(`
				CREATE TABLE "avatar_decoration_application" (
					"id" character varying(32) NOT NULL,
					"parentId" character varying(32),
					"status" "avatar_decoration_application_status_enum" NOT NULL DEFAULT 'pending',
					"name" character varying(128) NOT NULL,
					"userId" character varying(32),
					"description" character varying(2048),
					"fileId" character varying(32),

					"additionalInfo" character varying(1024),
					"comment" character varying(1024),
					"updatedAt" TIMESTAMP WITH TIME ZONE,

					PRIMARY KEY ("id")
				)
			`);


			queryRunner.query(`CREATE INDEX "IDX_2c56342299844e3e915d258c7e" ON "avatar_decoration_application" ("userId") `);
			queryRunner.query(`
				ALTER TABLE "avatar_decoration_application"
				ADD CONSTRAINT "FK_421ba5780521486d8c8e809b8d" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE`
			);

			queryRunner.query(`CREATE INDEX "IDX_2b35d3cd58754076abe73478c3" ON "avatar_decoration_application" ("fileId") `);
			queryRunner.query(
				`ALTER TABLE "avatar_decoration_application"
				ADD CONSTRAINT "FK_6433e52c026f4c54afffb51971" FOREIGN KEY ("fileId") REFERENCES "drive_file"("id") ON DELETE SET NULL ON UPDATE CASCADE`
			);

			//parent_id
			queryRunner.query(`CREATE INDEX "IDX_77b0277d30454fe09d6253a7e3" ON "avatar_decoration_application" ("parentId") `);
			queryRunner.query(`
				ALTER TABLE "avatar_decoration_application"
				ADD CONSTRAINT "FK_a95f10005eeb4278b526ca1bc2" FOREIGN KEY ("parentId") REFERENCES "avatar_decoration_application"("id") ON DELETE SET NULL ON UPDATE CASCADE`
			);
    }

    async down(queryRunner) {
			queryRunner.query(`ALTER TABLE "avatar_decoration_application" DROP CONSTRAINT "FK_6433e52c026f4c54afffb51971"`);
			queryRunner.query(`DROP INDEX "IDX_2b35d3cd58754076abe73478c3"`);
			queryRunner.query(`ALTER TABLE "avatar_decoration_application" DROP CONSTRAINT "FK_421ba5780521486d8c8e809b8d"`);
			queryRunner.query(`DROP INDEX "IDX_2c56342299844e3e915d258c7e"`);
			queryRunner.query(`ALTER TABLE "avatar_decoration_application" DROP CONSTRAINT "FK_a95f10005eeb4278b526ca1bc2"`);
			queryRunner.query(`DROP INDEX "IDX_77b0277d30454fe09d6253a7e3"`);

			queryRunner.query(`DROP TABLE "avatar_decoration_application"`);
			queryRunner.query(`DROP TYPE "avatar_decoration_application_status_enum"`);
    }
}
