/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, OneToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { MiUser } from './User.js';

@Entity('user_creation')
export class MiUserCreation {
	@PrimaryColumn('varchar', { length: 32 })
	public userId: string;

	@OneToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'userId' })
	public user: MiUser;

	@Column('bigint', {
		comment: 'The user creation order.',
		generated: 'increment',
	})
	public order: number;

	constructor(data: Partial<MiUserCreation>) {
		if (data) {
			Object.assign(this, data);
		}
	}
}
