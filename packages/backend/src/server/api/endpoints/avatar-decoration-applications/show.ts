/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AvatarDecorationApplicationsRepository } from '@/models/_.js';
import { AvatarDecorationApplicationEntityService } from '@/core/entities/AvatarDecorationApplicationEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['avatar-decoration-applications', 'account'],

	requireCredential: true,

	kind: 'read:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'AvatarDecorationApplication',
	},

	errors: {
		avatarDecorationApplicationNotFound: {
			message: 'avatar decoration application not found',
			code: 'avatar_Decoration_application_not_found',
			id: 'b04757a4-eb27-44bb-b616-9c2c05092fbe',
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
		@Inject(DI.avatarDecorationsRepository)
		avatarDecorationApplicationsRepository: AvatarDecorationApplicationsRepository,

		avatarDecorationApplicationEntityService: AvatarDecorationApplicationEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const avatarDecorationApplication = await avatarDecorationApplicationsRepository.findOneBy({
				id: ps.id,
				userId: me.id,
			});

			if (avatarDecorationApplication === null) {
				throw new ApiError(meta.errors.avatarDecorationApplicationNotFound);
			}

			return await avatarDecorationApplicationEntityService.pack(avatarDecorationApplication);
		});
	}
}
