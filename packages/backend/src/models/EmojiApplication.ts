/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EmojiApplicationStatus } from '@/types.js';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiDriveFile } from './DriveFile.js';

@Entity('emoji_application')
export class MiEmojiApplication {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		nullable: true,
	})
	public updatedAt: Date | null;

	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: 'parent request id of Request',
	})
	public parentId: MiEmojiApplication['id'];

	@ManyToOne(() => MiEmojiApplication, {
		onDelete: 'SET NULL',
	})
	@JoinColumn()
	public parent: MiEmojiApplication;

	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: 'user id of Request',
	})
	public userId: MiUser['id'] | null;

	// TODO: SET NULLやめる
	@ManyToOne(() => MiUser, {
		onDelete: 'SET NULL',
	})
	@JoinColumn()
	public user: MiUser;

	@Index()
	@Column('varchar', {
		length: 128,
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
	@Column('enum', { enum: EmojiApplicationStatus, default: 'pending' })
	public status: typeof EmojiApplicationStatus[number];

	@Column('varchar', {
		length: 128, nullable: true,
	})
	public category: string | null;

	@Column('varchar', {
		array: true, length: 128, default: '{}',
	})
	public aliases: string[];

	@Column('varchar', {
		length: 1024, nullable: true,
	})
	public license: string | null;

	@Column('boolean', {
		default: false,
	})
	public localOnly: boolean;

	@Column('boolean', {
		default: false,
	})
	public isSensitive: boolean;

	@Column('varchar', {
		length: 1024, nullable: true,
	})
	public additionalInfo: string | null;

	@Column('varchar', {
		length: 1024, nullable: true,
	})
	public comment: string | null;

	//TODO: リアクション可能なロールIDを持てるようにするか検討
}
