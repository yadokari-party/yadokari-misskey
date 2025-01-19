/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { type EmojiApplicationsRepository } from '@/models/_.js';
import type { Packed } from '@/misc/json-schema.js';
import type { } from '@/models/Blocking.js';
import type { MiEmojiApplication } from '@/models/EmojiApplication.js';
import { bindThis } from '@/decorators.js';
import type { MiUser } from '@/models/_.js';
import { RoleService } from '../RoleService.js';
import { DriveFileEntityService } from './DriveFileEntityService.js';

@Injectable()
export class EmojiApplicationEntityService {
	constructor(
		@Inject(DI.emojiApplicationsRepoisitory)
		private emojiApplicationsRepository: EmojiApplicationsRepository,

		private driveFileEntityService: DriveFileEntityService,
		private roleService: RoleService,
	) {
	}

	@bindThis
	public async pack(
		src: MiEmojiApplication['id'] | MiEmojiApplication,
		me?: MiUser,
	): Promise<Packed<'EmojiApplication'>> {
		const emojiApplication = typeof src === 'object' ? src : await this.emojiApplicationsRepository.findOneByOrFail({ id: src });

		const isGraterThanModrator = me != null && (await this.roleService.isModerator(me) || await this.roleService.isAdministrator(me));

		return {
			id: emojiApplication.id,
			parentId: emojiApplication.parentId,
			userId: emojiApplication.userId,
			status: emojiApplication.status,
			aliases: emojiApplication.aliases,
			name: emojiApplication.name,
			category: emojiApplication.category,
			license: emojiApplication.license,
			isSensitive: emojiApplication.isSensitive,
			localOnly: emojiApplication.localOnly,
			file: await this.driveFileEntityService.pack(emojiApplication.file),
			additionalInfo: emojiApplication.additionalInfo,
			...(isGraterThanModrator ? {
				comment: emojiApplication.comment,
			} : {}),
		};
	}

	@bindThis
	public packMany(
		emojiApplications: MiEmojiApplication[],
	) {
		return Promise.all(emojiApplications.map(x => this.pack(x)));
	}
}

