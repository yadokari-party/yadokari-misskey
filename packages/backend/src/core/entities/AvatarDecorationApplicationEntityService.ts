/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { type AvatarDecorationApplicationsRepository } from '@/models/_.js';
import type { Packed } from '@/misc/json-schema.js';
import type { } from '@/models/Blocking.js';
import type { MiAvatarDecorationApplication } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import type { MiUser } from '@/models/_.js';
import { RoleService } from '../RoleService.js';
import { DriveFileEntityService } from './DriveFileEntityService.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class AvatarDecorationApplicationEntityService {
	constructor(
		@Inject(DI.avatarDecorationApplicationsRepository)
		private avatarDecorationApplicationsRepository: AvatarDecorationApplicationsRepository,

		private driveFileEntityService: DriveFileEntityService,
		private roleService: RoleService,
		private userEntityService: UserEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: MiAvatarDecorationApplication['id'] | MiAvatarDecorationApplication,
		me?: MiUser,
	): Promise<Packed<'AvatarDecorationApplication'>> {
		const avatarDecoirationApplication = typeof src === 'object' ? src : await this.avatarDecorationApplicationsRepository.findOneByOrFail({ id: src });

		const isGraterThanModrator = me != null && await this.roleService.isModerator(me);

		return {
			id: avatarDecoirationApplication.id,
			parentId: avatarDecoirationApplication.parentId,
			userId: avatarDecoirationApplication.userId,
			status: avatarDecoirationApplication.status,
			name: avatarDecoirationApplication.name,
			file: await this.driveFileEntityService.pack(avatarDecoirationApplication.fileId),
			description: avatarDecoirationApplication.description,
			additionalInfo: avatarDecoirationApplication.additionalInfo,
			...(isGraterThanModrator ? {
				comment: avatarDecoirationApplication.comment,
				...(avatarDecoirationApplication.userId != null ? { user: await this.userEntityService.pack(avatarDecoirationApplication.userId) } : {}),
			} : {}),
		};
	}

	@bindThis
	public packMany(
		avatarDecorationApplications: MiAvatarDecorationApplication[],
		me? : MiUser,
	) {
		return Promise.all(avatarDecorationApplications.map(x => this.pack(x, me)));
	}
}

