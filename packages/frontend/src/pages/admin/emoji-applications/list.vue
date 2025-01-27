<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="900">
		<div :class="$style.root" class="_gaps">
			<MkPagination v-slot="{items}" ref="emojiApplications" :pagination="pagination">
				<div class="_gaps">
					<XEmojiApplication v-for="emojiApplication in items" :key="emojiApplication.id" :emojiApplication="emojiApplication" @accept.stop="onAccept" @reject.stop="onReject"/>
				</div>
			</MkPagination>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, shallowRef, ref } from 'vue';
import XHeader from '../_header_.vue';
import MkPagination from '@/components/MkPagination.vue';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import XEmojiApplication from '@/components/emoji-application/MkEmojiApplication.vue';
import type * as Misskey from 'misskey-js';

const emojiApplications = shallowRef<InstanceType<typeof MkPagination>>();

const pagination = {
	endpoint: 'admin/emoji-applications' as const,
	limit: 10,
	params: computed(() => ({
	})),
};

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

function onAccept(emojiApplication: Misskey.entities.EmojiApplication) {
	emojiApplications.value?.reload();
}

function onReject(emojiApplication: Misskey.entities.EmojiApplication) {
	emojiApplications.value?.reload();
}

definePageMetadata(() => ({
	title: i18n.ts._emojiApplication.title,
	icon: 'ti ti-triangle-plus-2',
}));
</script>

<style module lang="scss">
.root {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: stretch;
}

.subMenus {
	display: flex;
	flex-direction: row;
	justify-content: flex-end;
	align-items: center;
}

.inputs {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
}
</style>
