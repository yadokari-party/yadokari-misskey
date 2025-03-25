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
import { AvatarDecorationApplicationEntityService } from '@/core/entities/AvatarDecorationApplicationEntityService.js';

import { LoggerService } from '@/core/LoggerService.js';

export const meta = {
	tags: ['admin', 'avatar-decoration-applications', 'reject'],

	requireCredential: true,
	requireRolePolicy: 'canManageAvatarDecorations',
	kind: 'write:admin:avatar-decorations',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'AvatarDecorationApplication',
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
		avatarDecorationApplicationEntityService: AvatarDecorationApplicationEntityService,
		loggerService: LoggerService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const logger = loggerService.getLogger('rejectAvatarDecorationApplication');

			logger.debug('Rejecting avatar decoration application');
			logger.debug('Avatar Decoration application ID: ' + ps.avatarDecorationApplicationId);
			const avatarDecorationApplication = await avatarDecorationApplicationsRepository.findOneBy({ id: ps.avatarDecorationApplicationId });
			logger.debug('Avatar Decoration application: ' + JSON.stringify(avatarDecorationApplication));

			if (avatarDecorationApplication == null) {
				throw new ApiError(meta.errors.noSuchAvatarDecorationApplication);
			}

			const result = await avatarDecorationApplicationService.reject(avatarDecorationApplication.id, me);

			if (typeof result !== 'string') {
				return avatarDecorationApplicationEntityService.pack(avatarDecorationApplication);
			} else {
				throw new ApiError(meta.errors.noSuchAvatarDecorationApplication);
			}
		});
	}
}
