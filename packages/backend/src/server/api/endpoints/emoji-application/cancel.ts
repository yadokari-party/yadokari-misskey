/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import { DI } from '@/di-symbols.js';
import { CustomEmojiApplicationService } from '@/core/CustomEmojiApplicationService.js';
import type { EmojiApplicationsRepository } from '@/models/_.js';

export const meta = {
	tags: ['emoji-requests'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	res: {
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
	},
	required: ['emojiApplicationId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(

		private customEmojiApplicationService: CustomEmojiApplicationService,

		@Inject(DI.emojiApplicationsRepoisitory)
		private emojiApplicationsRepository: EmojiApplicationsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const emojiApplication = await this.emojiApplicationsRepository.findOneBy({ id: ps.emojiApplicationId });

			if (emojiApplication == null) {
				throw new ApiError(meta.errors.noSuchEmojiApplication);
			}

			if (emojiApplication.userId !== me.id || emojiApplication.status !== 'pending') {
				throw new ApiError(meta.errors.noPermission);
			}

			await this.customEmojiApplicationService.cancel(emojiApplication.id, me);

			return {};
		});
	}
}
