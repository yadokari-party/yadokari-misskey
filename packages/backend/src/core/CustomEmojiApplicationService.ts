/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import * as Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import type { MiDriveFile } from '@/models/DriveFile.js';
import type { MiEmoji } from '@/models/Emoji.js';
import type { EmojiApplicationsRepository, MiEmojiApplication, MiUser } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { DriveService } from './DriveService.js';
import { CustomEmojiService } from './CustomEmojiService.js';

@Injectable()
export class CustomEmojiApplicationService implements OnApplicationShutdown {
	constructor(
		@Inject(DI.emojiApplicationsRepoisitory)
		private emojiApplicationsRepository: EmojiApplicationsRepository,

		private idService: IdService,
		private moderationLogService: ModerationLogService,

		private customEmojiService: CustomEmojiService,
		private driveService: DriveService,
	) {
	}
	onApplicationShutdown(signal?: string) {
		throw new Error('Method not implemented.');
	}

	private async copyFileToSystem(file: MiDriveFile): Promise<MiDriveFile> {
		const copiedFile = await this.driveService.uploadFromUrl({
			url: file.url,
			user: null,
			force: true,
		});
		return copiedFile;
	}

	@bindThis
	public async create(data: {
		driveFile: MiDriveFile;
		name: string;
		category: string | null;
		aliases: string[];
		license: string | null;
		isSensitive: boolean;
		localOnly: boolean;
		parentId: MiEmojiApplication['id'] | null;
		additionalInfo: string | null;
	}, me: MiUser): Promise<MiEmojiApplication | 'SAME_NAME_EMOJI_EXISTS'> {
		const duplicate = await this.customEmojiService.checkDuplicate(data.name);

		if (duplicate) {
			return 'SAME_NAME_EMOJI_EXISTS';
		}

		const emojiApplication = await this.emojiApplicationsRepository.insertOne({
			id: this.idService.gen(),
			updatedAt: new Date(),
			userId: me.id,
			name: data.name,
			category: data.category,
			aliases: data.aliases,
			license: data.license,
			isSensitive: data.isSensitive,
			localOnly: data.localOnly,
			fileId: data.driveFile.id,
			additionalInfo: data.additionalInfo,
			status: 'pending',
		});

		return emojiApplication;
	}

	@bindThis
	public async update(id: MiEmojiApplication['id'], data: {
		name: string;
		driveFile?: MiDriveFile;
		category?: string | null;
		aliases?: string[];
		license?: string | null;
		isSensitive?: boolean;
		localOnly?: boolean;
		additionalInfo?: string | null;
	}, me: MiUser): Promise<
		MiEmojiApplication
		| 'NO_SUCH_emoji_application'
		| 'NO_PERMISSION'
		| 'SAME_NAME_EMOJI_EXISTS'
	> {
		const emojiApplication = await this.emojiApplicationsRepository.findOneBy({ id });
		if (emojiApplication == null) return 'NO_SUCH_emoji_application';

		if (emojiApplication.userId !== me.id) {
			return 'NO_PERMISSION';
		}

		const duplicate = await this.customEmojiService.checkDuplicate(data.name);

		if (duplicate) {
			return 'SAME_NAME_EMOJI_EXISTS';
		}

		await this.emojiApplicationsRepository.update(id, {
			updatedAt: new Date(),
			name: data.name,
			category: data.category,
			aliases: data.aliases,
			license: data.license,
			isSensitive: data.isSensitive,
			localOnly: data.localOnly,
			file: data.driveFile,
			additionalInfo: data.additionalInfo,
		});

		return this.emojiApplicationsRepository.findOneByOrFail({ id });
	}
	@bindThis
	public async cancel(id: MiEmojiApplication['id'], me: MiUser): Promise<void | 'NO_SUCH_emoji_application' | 'NO_PERMISSION'> {
		const emojiApplication = await this.emojiApplicationsRepository.findOneBy({ id });

		if (emojiApplication == null) {
			return 'NO_SUCH_emoji_application';
		}

		if (emojiApplication.userId !== me.id) {
			return 'NO_PERMISSION';
		}

		await this.emojiApplicationsRepository.update(emojiApplication.id, {
			status: 'canceled',
		});
	}

	@bindThis
	public async reject(id: MiEmojiApplication['id'], moderator: MiUser): Promise<void | 'NO_SUCH_emoji_application'> {
		const emojiApplication = await this.emojiApplicationsRepository.findOneBy({ id });

		if (emojiApplication == null) {
			return 'NO_SUCH_emoji_application';
		}

		await this.emojiApplicationsRepository.update(emojiApplication.id, {
			status: 'rejected',
		});
	}

	@bindThis
	public async accept(id: MiEmojiApplication['id'], moderator: MiUser): Promise<MiEmoji | 'NO_SUCH_emoji_application'> {
		const emojiApplication = await this.emojiApplicationsRepository.findOneBy({ id });

		if (emojiApplication == null) {
			return 'NO_SUCH_emoji_application';
		}

		const file = await this.copyFileToSystem(emojiApplication.file);

		const emoji = await this.customEmojiService.add({
			name: emojiApplication.name,
			category: emojiApplication.category,
			aliases: emojiApplication.aliases,
			host: null,
			license: emojiApplication.license,
			isSensitive: emojiApplication.isSensitive,
			localOnly: emojiApplication.localOnly,
			driveFile: file,
			roleIdsThatCanBeUsedThisEmojiAsReaction: [],
		}, moderator);

		await this.emojiApplicationsRepository.update(emojiApplication.id, {
			status: 'accepted',
		});

		return emoji;
	}
}
