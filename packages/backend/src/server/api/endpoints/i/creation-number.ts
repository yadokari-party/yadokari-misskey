/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UserCreationsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['account', 'creation'],

	requireCredential: true,

	kind: 'read:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			userId: { type: 'string', format: 'misskey:id' },
			order: { type: 'integer', format: 'int64', description: 'The user creation order.' },
		},
		required: ['userId', 'order'],
		description: 'Returns the user creation order.',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.userCreationsRepository)
		private userCreationsRepository: UserCreationsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const creation = await this.userCreationsRepository.findOneByOrFail({ userId: me.id });

			return {
				userId: creation.userId,
				order: creation.order,
			};
		});
	}
}
