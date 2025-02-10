/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { EmojiApplicationsRepository } from '@/models/_.js';
import { EmojiApplicationEntityService } from '@/core/entities/EmojiApplicationEntityService.js';
import { DI } from '@/di-symbols.js';
import { QueryService } from '@/core/QueryService.js';

export const meta = {
	tags: ['emoji-requests', 'account'],

	requireCredential: true,
	requireRolePolicy: 'canManageCustomEmojis',

	kind: 'read:admin:emoji',

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
	properties: {
		sinceId: { type: 'string', format: 'misskey:id', nullable: true },
		untilId: { type: 'string', format: 'misskey:id', nullable: true },
		limit: { type: 'integer', maximum: 100, minimum: 1, default: 10 },
		status: { type: 'string', enum: ['all', 'pending', 'canceled', 'accepted', 'rejected'], nullable: true },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.emojiApplicationsRepoisitory)
			emojiApplicationsRepository: EmojiApplicationsRepository,

			emojiApplicationEntityService: EmojiApplicationEntityService,

			queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = await queryService.makePaginationQuery(emojiApplicationsRepository.createQueryBuilder('emojiApplication'), ps.sinceId, ps.untilId);

			if (ps.status) {
				switch (ps.status) {
					case 'pending':
						query.andWhere('emojiApplication.status = :status', { status: 'pending' });
						break;
					case 'canceled':
						query.andWhere('emojiApplication.status = :status', { status: 'canceled' });
						break;
					case 'accepted':
						query.andWhere('emojiApplication.status = :status', { status: 'accepted' });
						break;
					case 'rejected':
						query.andWhere('emojiApplication.status = :status', { status: 'rejected' });
						break;
				}
			}

			const emojiApplications = await query.limit(ps.limit).getMany();

			return await emojiApplicationEntityService.packMany(emojiApplications, me);
		});
	}
}
