/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { EmojiApplicationsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { CustomEmojiApplicationService } from '@/core/CustomEmojiApplicationService.js';
import { ApiError } from '@/server/api/error.js';
import { EmojiEntityService } from '@/core/entities/EmojiEntityService.js';

export const meta = {
	tags: ['admin', 'emoji-requests', 'accpet'],

	requireCredential: true,
	requireRolePolicy: 'canManageCustomEmojis',
	kind: 'write:admin:emoji',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'EmojiDetailed',
	},

	errors: {
		noSuchEmojiApplication: {
			message: 'No such emoji request.',
			code: 'NO_SUCH_EMOJI_APPLICATION',
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
	},
	required: ['emojiApplicationId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.emojiApplicationsRepoisitory)
			emojiApplicationsRepository: EmojiApplicationsRepository,

			customEmojiApplicationService: CustomEmojiApplicationService,
			emojiEntityService: EmojiEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const emojiApplication = await emojiApplicationsRepository.findOneBy({ id: ps.emojiApplicationId });

			if (emojiApplication == null) {
				throw new ApiError(meta.errors.noSuchEmojiApplication);
			}

			const result = await customEmojiApplicationService.accept(emojiApplication.id, me);

			if (typeof result !== 'string') {
				return await emojiEntityService.packDetailed(result);
			} else {
				throw new ApiError(meta.errors.noSuchEmojiApplication);
			}
		});
	}
}
