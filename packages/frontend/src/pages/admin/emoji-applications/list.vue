<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 900px;">
		<div :class="$style.root" class="_gaps">
			<div :class="$style.inputs" class="_gaps">
				<MkSelect v-model="status" style="margin: 0; flex: 1;">
					<template #label>{{ i18n.ts.state }}</template>
					<option value="all">{{ i18n.ts.all }}</option>
					<option value="pending">{{ i18n.ts._emojiApplication._status.pending }}</option>
					<option value="canceled">{{ i18n.ts._emojiApplication._status.canceled }}</option>
					<option value="accepted">{{ i18n.ts._emojiApplication._status.accepted }}</option>
					<option value="rejected">{{ i18n.ts._emojiApplication._status.rejected }}</option>
				</MkSelect>
			</div>
			<MkPagination v-slot="{items}" ref="emojiApplications" :pagination="pagination">
				<div class="_gaps">
					<XEmojiApplication v-for="emojiApplication in items" :key="emojiApplication.id" :emojiApplication="emojiApplication" @accept="reload" @reject="reload"/>
				</div>
			</MkPagination>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, useTemplateRef, ref } from 'vue';
import type { Ref } from 'vue';
import type * as Misskey from 'misskey-js';
import MkPagination from '@/components/MkPagination.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import XEmojiApplication from '@/components/emoji-application/MkEmojiApplication.vue';
import MkSelect from '@/components/MkSelect.vue';

const emojiApplications = useTemplateRef('emojiApplications');

const status: Ref<'all' | Misskey.entities.EmojiApplication['status']> = ref<'all' | Misskey.entities.EmojiApplication['status']>('all');

const pagination = {
	endpoint: 'admin/emoji-applications' as const,
	limit: 10,
	params: computed(() => ({
		status: status.value,
	})),
};

const reload = () => {
	emojiApplications.value?.paginator?.reload();
};

const headerActions = computed(() => [
	{
		icon: 'ti ti-reload',
		text: i18n.ts.reload,
		handler: reload,
	},
]);

const headerTabs = computed(() => []);

definePage(() => ({
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
