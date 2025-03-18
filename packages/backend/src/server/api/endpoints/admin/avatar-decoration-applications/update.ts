/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import { AvatarDecorationApplicationEntityService } from '@/core/entities/AvatarDecorationApplicationEntityService.js';
import { DI } from '@/di-symbols.js';
import { AvatarDecorationApplicationService } from '@/core/AvatarDecorationApplicationService.js';
import type { DriveFilesRepository } from '@/models/_.js';
import type { AvatarDecorationApplicationsRepository } from '@/models/_.js';
import { RoleService } from '@/core/RoleService.js';

export const meta = {
	tags: ['avatar-decoration-applications'],

	requireCredential: true,

	prohibitMoved: true,

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
		comment: { type: 'string' },
	},
	required: ['avatarDecorationApplicationId', 'comment'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private avatarDecorationApplicationEntityService: AvatarDecorationApplicationEntityService,

		private avatarDecorationApplicationService: AvatarDecorationApplicationService,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.avatarDecorationApplicationsRepository)
		private avatarDecorationApplicationsRepository: AvatarDecorationApplicationsRepository,

		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const emojiApplication = await this.avatarDecorationApplicationsRepository.findOneBy({ id: ps.avatarDecorationApplicationId });

			if (emojiApplication == null) {
				throw new ApiError(meta.errors.noSuchAvatarDecorationApplication);
			}

			if (!(await this.roleService.isModerator(me))) {
				throw new ApiError(meta.errors.noPermission);
			}

			const updated = await this.avatarDecorationApplicationService.updateComment(ps.avatarDecorationApplicationId, {
				comment: ps.comment,
			}, me);

			return this.avatarDecorationApplicationEntityService.pack(updated);
		});
	}
}
