/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, PrimaryColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AvatarDecorationApplicationStatus } from '@/types.js';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiDriveFile } from './DriveFile.js';

@Entity('avatar_decoration_application')
export class MiAvatarDecorationApplication {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		nullable: true,
	})
	public updatedAt: Date | null;

	@Column('varchar', {
		length: 256,
	})
	public name: string;

	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: 'file id',
	})
	public fileId: MiDriveFile['id'];

	@ManyToOne(() => MiDriveFile, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public file: MiDriveFile;

	/**
	 * pending ... 申請中
	 * cancelled ... 取り消し
	 * rejected ... 拒否
	 * accepted ... 承認
	 */
	@Column('enum', { enum: AvatarDecorationApplicationStatus, default: 'pending' })
	public status: typeof AvatarDecorationApplicationStatus[number];

	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: 'parent request id of Request',
	})
	public parentId: MiAvatarDecorationApplication['id'];

	@ManyToOne(() => MiAvatarDecorationApplication, {
		onDelete: 'SET NULL',
	})
	@JoinColumn()
	public parent: MiAvatarDecorationApplication;

	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: 'user id of Request',
	})
	public userId: MiUser['id'] | null;

	@Column('varchar', {
		length: 2048,
	})
	public description: string;

	@Column('varchar', {
		length: 1024, nullable: true,
	})
	public additionalInfo: string | null;

	@Column('varchar', {
		length: 1024, nullable: true,
	})
	public comment: string | null;
}
