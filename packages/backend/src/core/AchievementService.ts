/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UserProfilesRepository, UsersRepository } from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import type { MiUserProfile } from '@/models/UserProfile.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { NotificationService } from '@/core/NotificationService.js';
import { IdService } from '@/core/IdService.js';
import { ACHIEVEMENT_TYPES } from '@/models/UserProfile.js';

type AchievementVerifierArgs = {
	user: MiUser;
	profile: MiUserProfile;
	idService: IdService;
};

type AchievementVerifier = (args: AchievementVerifierArgs) => Promise<boolean>;

@Injectable()
export class AchievementService {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private notificationService: NotificationService,
		private idService: IdService,
	) {
	}

	private verifiers: { [key: string]: AchievementVerifier } = {
		'notes1': async ({ user }) => user.notesCount >= 1,
		'notes10': async ({ user }) => user.notesCount >= 10,
		'notes100': async ({ user }) => user.notesCount >= 100,
		'notes500': async ({ user }) => user.notesCount >= 500,
		'notes1000': async ({ user }) => user.notesCount >= 1000,
		'notes5000': async ({ user }) => user.notesCount >= 5000,
		'notes10000': async ({ user }) => user.notesCount >= 10000,
		'notes20000': async ({ user }) => user.notesCount >= 20000,
		'notes30000': async ({ user }) => user.notesCount >= 30000,
		'notes40000': async ({ user }) => user.notesCount >= 40000,
		'notes50000': async ({ user }) => user.notesCount >= 50000,
		'notes60000': async ({ user }) => user.notesCount >= 60000,
		'notes70000': async ({ user }) => user.notesCount >= 70000,
		'notes80000': async ({ user }) => user.notesCount >= 80000,
		'notes90000': async ({ user }) => user.notesCount >= 90000,
		'notes100000': async ({ user }) => user.notesCount >= 100000,
		'login3': async ({ profile }) => profile.loggedInDates.length >= 3,
		'login7': async ({ profile }) => profile.loggedInDates.length >= 7,
		'login15': async ({ profile }) => profile.loggedInDates.length >= 15,
		'login30': async ({ profile }) => profile.loggedInDates.length >= 30,
		'login60': async ({ profile }) => profile.loggedInDates.length >= 60,
		'login100': async ({ profile }) => profile.loggedInDates.length >= 100,
		'login200': async ({ profile }) => profile.loggedInDates.length >= 200,
		'login300': async ({ profile }) => profile.loggedInDates.length >= 300,
		'login400': async ({ profile }) => profile.loggedInDates.length >= 400,
		'login500': async ({ profile }) => profile.loggedInDates.length >= 500,
		'login600': async ({ profile }) => profile.loggedInDates.length >= 600,
		'login700': async ({ profile }) => profile.loggedInDates.length >= 700,
		'login800': async ({ profile }) => profile.loggedInDates.length >= 800,
		'login900': async ({ profile }) => profile.loggedInDates.length >= 900,
		'login1000': async ({ profile }) => profile.loggedInDates.length >= 1000,
		'passedSinceAccountCreated1': async ({ user, idService }) => (Date.now() - idService.parse(user.id).date.getTime()) >= 1000 * 60 * 60 * 24 * 365,
		'passedSinceAccountCreated2': async ({ user, idService }) => (Date.now() - idService.parse(user.id).date.getTime()) >= 1000 * 60 * 60 * 24 * 365 * 2,
		'passedSinceAccountCreated3': async ({ user, idService }) => (Date.now() - idService.parse(user.id).date.getTime()) >= 1000 * 60 * 60 * 24 * 365 * 3,
		'loggedInOnBirthday': async ({ profile }) => {
			if (!profile.birthday) return false;
			const now = new Date();
			const birthday = new Date(profile.birthday);
			return now.getMonth() === birthday.getMonth() && now.getDate() === birthday.getDate();
		},
		'profileFilled': async ({ user, profile }) => !!(user.name && profile.description && user.avatarId && user.bannerId),
		'markedAsCat': async ({ user }) => user.isCat === true,
		'following1': async ({ user }) => user.followingCount >= 1,
		'following10': async ({ user }) => user.followingCount >= 10,
		'following50': async ({ user }) => user.followingCount >= 50,
		'following100': async ({ user }) => user.followingCount >= 100,
		'following300': async ({ user }) => user.followingCount >= 300,
		'followers1': async ({ user }) => user.followersCount >= 1,
		'followers10': async ({ user }) => user.followersCount >= 10,
		'followers50': async ({ user }) => user.followersCount >= 50,
		'followers100': async ({ user }) => user.followersCount >= 100,
		'followers300': async ({ user }) => user.followersCount >= 300,
		'followers500': async ({ user }) => user.followersCount >= 500,
		'followers1000': async ({ user }) => user.followersCount >= 1000,
		'collectAchievements30': async ({ profile }) => profile.achievements.length >= 30,
		'setNameToSyuilo': async ({ user }) => user.name === 'syuilo',
	};

	private isVerifiable(type: typeof ACHIEVEMENT_TYPES[number]): boolean {
		return type in this.verifiers;
	}

	private async verify(userId: MiUser['id'], type: typeof ACHIEVEMENT_TYPES[number]): Promise<boolean> {
		const verifier = this.verifiers[type];

		const user = await this.usersRepository.findOneBy({ id: userId });
		if (!user) return false;

		const profile = await this.userProfilesRepository.findOneBy({ userId: userId });
		if (!profile) return false;

		return await verifier({
			user,
			profile,
			idService: this.idService,
		});
	}

	@bindThis
	public async create(
		userId: MiUser['id'],
		type: typeof ACHIEVEMENT_TYPES[number],
		bypassVerification = true,
	): Promise<void> {
		if (!ACHIEVEMENT_TYPES.includes(type)) return;

		if (!bypassVerification || this.isVerifiable(type)) {
			const verified = await this.verify(userId, type);
			if (!verified) {
				// Grant cheater achievement
				await this.create(userId, 'cheater');
				return;
			}
		}

		const date = Date.now();

		const profile = await this.userProfilesRepository.findOneByOrFail({ userId: userId });

		if (profile.achievements.some(a => a.name === type)) return;

		await this.userProfilesRepository.update(userId, {
			achievements: [...profile.achievements, {
				name: type,
				unlockedAt: date,
			}],
		});

		this.notificationService.createNotification(userId, 'achievementEarned', {
			achievement: type,
		});
	}
}
