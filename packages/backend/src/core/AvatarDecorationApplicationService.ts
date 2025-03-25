/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import type { DriveFilesRepository, AvatarDecorationApplicationsRepository, MiAvatarDecoration, MiAvatarDecorationApplication, MiUser, MiDriveFile } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { RoleService } from '@/core/RoleService.js';
import { DriveService } from './DriveService.js';
import { AvatarDecorationService } from './AvatarDecorationService.js';

@Injectable()
export class AvatarDecorationApplicationService {
	constructor(
		@Inject(DI.avatarDecorationApplicationsRepository)
		private avatarDecorationApplicationsRepository: AvatarDecorationApplicationsRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private idService: IdService,
		private moderationLogService: ModerationLogService,

		private avatarDecorationService: AvatarDecorationService,
		private driveService: DriveService,
		private roleService: RoleService,
	) {
	}

	private async copyFileToSystem(fileId: MiDriveFile['id']): Promise<MiDriveFile> {
		const originalFile = await this.driveFilesRepository.findOneByOrFail({ id: fileId });
		const copiedFile = await this.driveService.uploadFromUrl({
			url: originalFile.url,
			user: null,
			force: true,
		});
		return copiedFile;
	}

	@bindThis
	public async create(data: {
		driveFile: MiDriveFile;
		name: string;
		parentId: MiAvatarDecorationApplication['id'] | null;
		description: string | null;
		additionalInfo: string | null;
	}, me: MiUser): Promise<MiAvatarDecorationApplication> {
		const avatarDecorationApplication = await this.avatarDecorationApplicationsRepository.insertOne({
			id: this.idService.gen(),
			updatedAt: new Date(),
			userId: me.id,
			name: data.name,
			fileId: data.driveFile.id,
			description: data.description ?? '',
			additionalInfo: data.additionalInfo,
			status: 'pending',
		});

		return avatarDecorationApplication;
	}

	@bindThis
	public async update(id: MiAvatarDecorationApplication['id'], data: {
		name: string;
		driveFile?: MiDriveFile;
		description?: string | null;
		additionalInfo?: string | null;
	}, me: MiUser): Promise<
		MiAvatarDecorationApplication
		| 'NO_SUCH_AVATAR_DECORATION_APPLICATION'
		| 'NO_PERMISSION'
		> {
		const avatarDecorationApplication = await this.avatarDecorationApplicationsRepository.findOneBy({ id });
		if (avatarDecorationApplication == null) return 'NO_SUCH_AVATAR_DECORATION_APPLICATION';

		if (avatarDecorationApplication.userId !== me.id) {
			return 'NO_PERMISSION';
		}

		await this.avatarDecorationApplicationsRepository.update(id, {
			updatedAt: new Date(),
			name: data.name,
			file: data.driveFile,
			description: data.description ?? '',
			additionalInfo: data.additionalInfo,
		});

		return this.avatarDecorationApplicationsRepository.findOneByOrFail({ id });
	}

	@bindThis
	public async updateComment(id: MiAvatarDecorationApplication['id'], data: {
		comment: string;
	}, moderator: MiUser): Promise<
		MiAvatarDecorationApplication
		| 'NO_SUCH_AVATAR_DECORATION_APPLICATION'
		| 'NO_PERMISSION'
		> {
		const AvatarDecorationApplication = await this.avatarDecorationApplicationsRepository.findOneBy({ id });
		if (AvatarDecorationApplication == null) return 'NO_SUCH_AVATAR_DECORATION_APPLICATION';

		const userPolicy = await this.roleService.getUserPolicies(moderator.id);

		if (userPolicy.canManageCustomEmojis !== true && !(await this.roleService.isModerator(moderator))) {
			return 'NO_PERMISSION';
		}

		await this.avatarDecorationApplicationsRepository.update(id, {
			updatedAt: new Date(),
			comment: data.comment,
		});

		return this.avatarDecorationApplicationsRepository.findOneByOrFail({ id });
	}

	@bindThis
	public async cancel(id: MiAvatarDecorationApplication['id'], me: MiUser): Promise<void | 'NO_SUCH_AVATAR_DECORATION_APPLICATION' | 'NO_PERMISSION'> {
		const avaratDecorationApplication = await this.avatarDecorationApplicationsRepository.findOneBy({ id });

		if (avaratDecorationApplication == null) {
			return 'NO_SUCH_AVATAR_DECORATION_APPLICATION';
		}

		if (avaratDecorationApplication.userId !== me.id) {
			return 'NO_PERMISSION';
		}

		await this.avatarDecorationApplicationsRepository.update(avaratDecorationApplication.id, {
			status: 'canceled',
		});
	}

	@bindThis
	public async reject(id: MiAvatarDecoration['id'], moderator: MiUser): Promise<void | 'NO_SUCH_AVATAR_DECORATION_APPLICATION' | 'NO_PERMISSION'> {
		const avatarDecorationApplication = await this.avatarDecorationApplicationsRepository.findOneBy({ id });

		if (avatarDecorationApplication == null) {
			return 'NO_SUCH_AVATAR_DECORATION_APPLICATION';
		}

		const userPolicy = await this.roleService.getUserPolicies(moderator.id);
		const isModerator = await this.roleService.isModerator(moderator);

		if (userPolicy.canManageCustomEmojis !== true && !isModerator) {
			return 'NO_PERMISSION';
		}

		await this.avatarDecorationApplicationsRepository.update(avatarDecorationApplication.id, {
			status: 'rejected',
		});
	}

	@bindThis
	public async accept(id: MiAvatarDecorationApplication['id'], moderator: MiUser): Promise<MiAvatarDecoration | 'NO_SUCH_AVATAR_DECORATION_APPLICATION' | 'NO_PERMISSION'> {
		const avatarDecorationApplication = await this.avatarDecorationApplicationsRepository.findOneBy({ id });

		if (avatarDecorationApplication == null) {
			return 'NO_SUCH_AVATAR_DECORATION_APPLICATION';
		}

		const userPolicy = await this.roleService.getUserPolicies(moderator.id);
		const isModerator = await this.roleService.isModerator(moderator);

		if (userPolicy.canManageAvatarDecorations !== true && !isModerator) {
			return 'NO_PERMISSION';
		}

		const file = await this.copyFileToSystem(avatarDecorationApplication.fileId);

		const avatarDecoration = await this.avatarDecorationService.create({
			name: avatarDecorationApplication.name,
			url: file.webpublicUrl ?? file.url,
			description: avatarDecorationApplication.description,
			roleIdsThatCanBeUsedThisDecoration: [],
		}, moderator);

		await this.avatarDecorationApplicationsRepository.update(avatarDecorationApplication.id, {
			fileId: file.id,
			status: 'accepted',
		});

		return avatarDecoration;
	}
}
