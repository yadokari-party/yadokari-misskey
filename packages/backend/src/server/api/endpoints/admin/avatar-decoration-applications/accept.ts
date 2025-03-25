/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AvatarDecorationApplicationsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { AvatarDecorationApplicationService } from '@/core/AvatarDecorationApplicationService.js';
import { ApiError } from '@/server/api/error.js';
import { IdService } from '@/core/IdService.js';

export const meta = {
	tags: ['admin', 'avatar-decoration-applications', 'accept'],

	requireCredential: true,
	requireRolePolicy: 'canManageAvatarDecorations',
	kind: 'write:admin:avatar-decorations',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
			createdAt: {
				type: 'string',
				optional: false, nullable: false,
				format: 'date-time',
			},
			updatedAt: {
				type: 'string',
				optional: false, nullable: true,
				format: 'date-time',
			},
			name: {
				type: 'string',
				optional: false, nullable: false,
			},
			description: {
				type: 'string',
				optional: false, nullable: false,
			},
			url: {
				type: 'string',
				optional: false, nullable: false,
			},
			roleIdsThatCanBeUsedThisDecoration: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
				},
			},
		},
	},

	errors: {
		noSuchAvatarDecorationApplication: {
			message: 'No such avatar decoration request.',
			code: 'NO_SUCH_AVATAR_DECORATION_APPLICATION',
			id: 'fc8ec884-3037-45f8-bbf5-1c138b0b2e8b',
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
		avatarDecorationApplicationId: { type: 'string', format: 'misskey:id' },
	},
	required: ['avatarDecorationApplicationId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.avatarDecorationApplicationsRepository)
		avatarDecorationApplicationsRepository: AvatarDecorationApplicationsRepository,

		avatarDecorationApplicationService: AvatarDecorationApplicationService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const avatarDecorationApplication = await avatarDecorationApplicationsRepository.findOneBy({ id: ps.avatarDecorationApplicationId });

			if (avatarDecorationApplication == null) {
				throw new ApiError(meta.errors.noSuchAvatarDecorationApplication);
			}

			const result = await avatarDecorationApplicationService.accept(avatarDecorationApplication.id, me);

			if (typeof result !== 'string') {
				return {
					id: result.id,
					createdAt: this.idService.parse(result.id).date.toISOString(),
					updatedAt: result.updatedAt?.toISOString() ?? null,
					name: result.name,
					description: result.description,
					url: result.url,
					roleIdsThatCanBeUsedThisDecoration: result.roleIdsThatCanBeUsedThisDecoration,
				};
			} else {
				throw new ApiError(meta.errors.noSuchAvatarDecorationApplication);
			}
		});
	}
}
