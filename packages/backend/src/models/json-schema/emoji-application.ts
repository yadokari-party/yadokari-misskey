/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EmojiApplicationStatus } from '@/types.js';

export const packedEmojiApplicationSchema = {
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
			enum: EmojiApplicationStatus,
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
		aliases: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
		},
		name: {
			type: 'string',
			optional: false, nullable: false,
		},
		category: {
			type: 'string',
			optional: false, nullable: true,
		},
		file: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'DriveFile',
		},
		license: {
			type: 'string',
			optional: false, nullable: true,
		},
		isSensitive: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		localOnly: {
			type: 'boolean',
			optional: false, nullable: false,
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
