/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AvatarDecorationApplicationStatus } from '@/types.js';

export const packedAvatarDecorationApplicationSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		status: {
			type: 'string',
			optional: false, nullable: false,
			enum: AvatarDecorationApplicationStatus,
		},
		parentId: {
			type: 'string',
			optional: false, nullable: true,
			format: 'id',
		},
		userId: {
			type: 'string',
			optional: false, nullable: true,
			format: 'id',
		},
		user: {
			type: 'object',
			optional: true, nullable: true,
			ref: 'User',
		},
		name: {
			type: 'string',
			optional: false, nullable: false,
		},
		file: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'DriveFile',
		},
		description: {
			type: 'string',
			optional: false, nullable: true,
		},
		additionalInfo: {
			type: 'string',
			optional: false, nullable: true,
		},
		comment: {
			type: 'string',
			optional: true, nullable: true,
		},
	},
} as const;
