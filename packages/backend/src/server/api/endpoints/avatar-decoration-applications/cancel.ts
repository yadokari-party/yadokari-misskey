/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import { DI } from '@/di-symbols.js';
import { AvatarDecorationApplicationService } from '@/core/AvatarDecorationApplicationService.js';
import type { AvatarDecorationApplicationsRepository } from '@/models/_.js';

export const meta = {
	tags: ['avatar-decoration-applications', 'cancel'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	res: {
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

		private avatarDecorationApplicationService: AvatarDecorationApplicationService,

		@Inject(DI.avatarDecorationApplicationsRepository)
		private avatarDecorationApplicationsRepository: AvatarDecorationApplicationsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const avatarDecorationApplication = await this.avatarDecorationApplicationsRepository.findOneBy({ id: ps.avatarDecorationApplicationId });

			if (avatarDecorationApplication == null) {
				throw new ApiError(meta.errors.noSuchAvatarDecorationApplication);
			}

			if (avatarDecorationApplication.userId !== me.id || avatarDecorationApplication.status !== 'pending') {
				throw new ApiError(meta.errors.noPermission);
			}

			await this.avatarDecorationApplicationService.cancel(avatarDecorationApplication.id, me);

			return {};
		});
	}
}
