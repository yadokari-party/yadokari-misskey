/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { EmojiApplicationsRepository } from '@/models/_.js';
import { EmojiApplicationEntityService } from '@/core/entities/EmojiApplicationEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['emoji-requests', 'account'],

	requireCredential: true,

	kind: 'read:account',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'EmojiApplication',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.emojiApplicationsRepoisitory)
			emojiApplicationsRepository: EmojiApplicationsRepository,

			emojiApplicationEntityService: EmojiApplicationEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const EmojiApplications = await emojiApplicationsRepository.findBy({
				userId: me.id,
			});

			return await emojiApplicationEntityService.packMany(EmojiApplications);
		});
	}
}
