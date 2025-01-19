/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import { EmojiApplicationEntityService } from '@/core/entities/EmojiApplicationEntityService.js';
import { DI } from '@/di-symbols.js';
import { CustomEmojiApplicationService } from '@/core/CustomEmojiApplicationService.js';
import type { DriveFilesRepository } from '@/models/_.js';
import type { EmojiApplicationsRepository } from '@/models/_.js';

export const meta = {
	tags: ['emoji-requests'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'EmojiApplication',
	},

	errors: {
		noSuchEmojiApplication: {
			message: 'No such emoji request.',
			code: 'NO_SUCH_emoji_application',
			id: 'b8f9b7b1-5a1b-4f3d-8f0e-6f2e1e5b0f9e',
		},
		noPermission: {
			message: 'No permission.',
			code: 'NO_PERMISSION',
			id: 'f2c7c8a1-4b7b-4c7f-8e0d-7f2e1e5b0f9e',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		emojiApplicationId: { type: 'string', format: 'misskey:id' },
		name: { type: 'string', pattern: '^[a-zA-Z0-9_]+$' },
		fileId: { type: 'string', format: 'misskey:id' },
		category: {
			type: 'string',
			nullable: true,
			description: 'Use `null` to reset the category.',
		},
		aliases: { type: 'array', nullable: true, items: {
			type: 'string',
		} },
		license: { type: 'string', nullable: true },
		isSensitive: { type: 'boolean' },
		localOnly: { type: 'boolean' },
	},
	required: ['emojiApplicationId', 'name', 'fileId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private emojiApplicationEntityService: EmojiApplicationEntityService,

		private customEmojiApplicationService: CustomEmojiApplicationService,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.emojiApplicationsRepoisitory)
		private emojiApplicationsRepository: EmojiApplicationsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const file = await this.driveFilesRepository.findOneByOrFail({ id: ps.fileId });

			const emojiApplication = await this.emojiApplicationsRepository.findOneBy({ id: ps.emojiApplicationId });

			if (emojiApplication == null) {
				throw new ApiError(meta.errors.noSuchEmojiApplication);
			}

			if (emojiApplication.userId !== me.id) {
				throw new ApiError(meta.errors.noPermission);
			}

			const updated = await this.customEmojiApplicationService.update(ps.emojiApplicationId, {
				driveFile: file,
				name: ps.name,
				category: ps.category ?? null,
				aliases: ps.aliases ?? [],
				license: ps.license ?? null,
				isSensitive: ps.isSensitive ?? false,
				localOnly: ps.localOnly ?? false,
			}, me);

			return this.emojiApplicationEntityService.pack(updated);
		});
	}
}
