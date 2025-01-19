/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class CreateEmojiApplications1737306298234 {
    name = 'CreateEmojiApplications1737306298234'

    async up(queryRunner) {
			await queryRunner.query(`CREATE TYPE "emoji_application_status_enum" AS ENUM('pending', 'canceled', 'rejected', 'accepted')`);

			queryRunner.query(`
				CREATE TABLE "emoji_application" (
					"id" character varying(32) NOT NULL,
					"parentId" character varying(32),
					"status" "emoji_application_status_enum" NOT NULL DEFAULT 'pending',
					"name" character varying(128) NOT NULL,
					"userId" character varying(32),
					"localOnly" boolean NOT NULL DEFAULT false,
					"isSensitive" boolean NOT NULL DEFAULT false,
					"aliases" character varying(128) array NOT NULL DEFAULT '{}'::varchar[],
					"category" character varying(128),
					"license" character varying(1024),
					"fileId" character varying(32),

					"additionalInfo" character varying(1024),
					"comment" character varying(1024),
					"updatedAt" TIMESTAMP WITH TIME ZONE,

					PRIMARY KEY ("id")
				)
			`);

			queryRunner.query(`
				CREATE INDEX "IDX_emoji_application_PARENT_ID" ON "emoji_application" ("parentId")
			`);

			queryRunner.query(`
				CREATE INDEX "IDX_emoji_application_STATUS" ON "emoji_application" ("status")
			`);

			queryRunner.query(`
				CREATE INDEX "IDX_emoji_application_USER_ID" ON "emoji_application" ("userId")
			`);

			queryRunner.query(`
				CREATE INDEX "IDX_emoji_application_NAME" ON "emoji_application" ("name")
			`);

			queryRunner.query(`
				ALTER TABLE "emoji_application"
				ADD CONSTRAINT "FK_emoji_application_USER_ID" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE
			`);

			queryRunner.query(`
				ALTER TABLE "emoji_application"
				ADD CONSTRAINT "FK_emoji_application_PARENT_ID" FOREIGN KEY ("parentId") REFERENCES "emoji_application"("id") ON DELETE SET NULL ON UPDATE CASCADE
			`);

			queryRunner.query(`
				ALTER TABLE "emoji_application"
				ADD CONSTRAINT "FK_emoji_application_FILE_ID" FOREIGN KEY ("fileId") REFERENCES "drive_file"("id") ON DELETE SET NULL ON UPDATE CASCADE
			`);
    }

    async down(queryRunner) {
			queryRunner.query(`
				ALTER TABLE "emoji_application"
				DROP CONSTRAINT "FK_emoji_application_PARENT_ID"
			`);

			queryRunner.query(`
				ALTER TABLE "emoji_application"
				DROP CONSTRAINT "FK_emoji_application_USER_ID"
			`);

			queryRunner.query(`
				ALTER TABLE "emoji_application"
				DROP CONSTRAINT "FK_emoji_application_FILE_ID"
			`);

			queryRunner.query(`
				DROP INDEX "IDX_emoji_application_NAME"
			`);

			queryRunner.query(`
				DROP INDEX "IDX_emoji_application_USER_ID"
			`);

			queryRunner.query(`
				DROP INDEX "IDX_emoji_application_STATUS"
			`);

			queryRunner.query(`
				DROP INDEX "IDX_emoji_application_PARENT_ID"
			`);

			queryRunner.query(`
				DROP TABLE "emoji_application"
			`);

			queryRunner.query(`
				DROP TYPE "emoji_application_status_enum"
			`);
    }

}
