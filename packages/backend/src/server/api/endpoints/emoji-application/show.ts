/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { EmojiApplicationsRepository } from '@/models/_.js';
import { EmojiApplicationEntityService } from '@/core/entities/EmojiApplicationEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['emoji-requests', 'account'],

	requireCredential: true,

	kind: 'read:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'EmojiApplication',
	},

	errors: {
		emojiApplicationNotFound: {
			message: 'emoji application not found',
			code: 'emoji_application_not_found',
			id: 'a5c3a4b2-4d0d-4d5c-9b2b-9d6b7d6b9d6b',
		},
	},

} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: { type: 'string', format: 'misskey:id' },
	},
	required: ['id'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.emojiApplicationsRepoisitory)
			emojiApplicationsRepository: EmojiApplicationsRepository,

			emojiApplicationEntityService: EmojiApplicationEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const emojiApplication = await emojiApplicationsRepository.findOneBy({
				id: ps.id,
				userId: me.id,
			});

			if (emojiApplication === null) {
				throw new ApiError(meta.errors.emojiApplicationNotFound);
			}

			return await emojiApplicationEntityService.pack(emojiApplication);
		});
	}
}
