/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import { EmojiApplicationEntityService } from '@/core/entities/EmojiApplicationEntityService.js';
import { DI } from '@/di-symbols.js';
import { CustomEmojiApplicationService } from '@/core/CustomEmojiApplicationService.js';
import type { DriveFilesRepository } from '@/models/_.js';

export const meta = {
	tags: ['emoji-requests'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	limit: {
		duration: ms('1hour'),
		max: 10,
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'EmojiApplication',
	},

	errors: {
		tooManyEmojiApplications: {
			message: 'You cannot send request any more.',
			code: 'TOO_MANY_emoji_applicationS',
			id: '920f7c2d-6208-4b76-8082-e632020f5883',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		parentId: { type: 'string', format: 'misskey:id', nullable: true },
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
		additionalInfo: { type: 'string', nullable: true },
	},
	required: ['name', 'fileId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private emojiApplicationEntityService: EmojiApplicationEntityService,

		private customEmojiApplicationService: CustomEmojiApplicationService,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const file = await this.driveFilesRepository.findOneByOrFail({ id: ps.fileId });

			const emojiApplication = await this.customEmojiApplicationService.create({
				driveFile: file,
				name: ps.name,
				category: ps.category ?? null,
				aliases: ps.aliases ?? [],
				license: ps.license ?? null,
				isSensitive: ps.isSensitive ?? false,
				localOnly: ps.localOnly ?? false,
				parentId: ps.parentId ?? null,
				additionalInfo: ps.additionalInfo ?? null,
			}, me);

			return this.emojiApplicationEntityService.pack(emojiApplication);
		});
	}
}
