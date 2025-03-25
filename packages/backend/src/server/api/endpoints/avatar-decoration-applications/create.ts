/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import { AvatarDecorationApplicationEntityService } from '@/core/entities/AvatarDecorationApplicationEntityService.js';
import { DI } from '@/di-symbols.js';
import { AvatarDecorationApplicationService } from '@/core/AvatarDecorationApplicationService.js';
import type { DriveFilesRepository } from '@/models/_.js';
import { RoleService } from '@/core/RoleService.js';

export const meta = {
	tags: ['avatar-decoration-applications', 'create'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	limit: {
		duration: ms('1hour'),
		max: 10,
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'AvatarDecorationApplication',
	},

	errors: {
		tooManyAvatarDecorationApplications: {
			message: 'You cannot send request any more.',
			code: 'TOO_MANY_AVATAR_DECORATION_APPLICATIONS',
			id: '1ab77930-dedd-4f62-9833-fd411bdcb1c1',
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
		parentId: { type: 'string', format: 'misskey:id', nullable: true },
		name: { type: 'string' },
		fileId: { type: 'string', format: 'misskey:id' },
		description: { type: 'string', nullable: true, maxLength: 2048 },
		additionalInfo: { type: 'string', nullable: true },
	},
	required: ['name', 'fileId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private avatarDecorationApplicationEntityService: AvatarDecorationApplicationEntityService,

		private avatarDecorationApplicationService: AvatarDecorationApplicationService,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const policies = await this.roleService.getUserPolicies(me.id);
			if (!policies.canCreateAvatarDecorationApplications && !(await this.roleService.isModerator(me))) {
				throw new ApiError(meta.errors.noPermission);
			}

			const file = await this.driveFilesRepository.findOneByOrFail({ id: ps.fileId });

			const avatarDecorationApplication = await this.avatarDecorationApplicationService.create({
				driveFile: file,
				name: ps.name,
				parentId: ps.parentId ?? null,
				description: ps.description ?? null,
				additionalInfo: ps.additionalInfo ?? null,
			}, me);

			return this.avatarDecorationApplicationEntityService.pack(avatarDecorationApplication);
		});
	}
}
