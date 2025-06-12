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
					<option value="pending">{{ i18n.ts._avatarDecorationApplication._status.pending }}</option>
					<option value="canceled">{{ i18n.ts._avatarDecorationApplication._status.canceled }}</option>
					<option value="accepted">{{ i18n.ts._avatarDecorationApplication._status.accepted }}</option>
					<option value="rejected">{{ i18n.ts._avatarDecorationApplication._status.rejected }}</option>
				</MkSelect>
			</div>
			<MkPagination v-slot="{items}" ref="avatarDecorationApplications" :pagination="pagination">
				<div class="_gaps">
					<XAvatarDecorationApplication
						v-for="avatarDecorationApplication in items"
						:key="avatarDecorationApplication.id"
						:avatarDecorationApplication="(avatarDecorationApplication as unknown as Misskey.entities.AvatarDecorationApplication)"
						@accept="reload"
						@reject="reload"
					/>
				</div>
			</MkPagination>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef } from 'vue';
import type { Ref } from 'vue';
import type * as Misskey from 'misskey-js';
import MkPagination from '@/components/MkPagination.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import XAvatarDecorationApplication from '@/components/avatar-decoration-application/MkAvatarDecorationApplication.vue';
import MkSelect from '@/components/MkSelect.vue';

const avatarDecorationApplications = useTemplateRef('avatarDecorationApplications');

const status : Ref<'all' | Misskey.entities.AvatarDecorationApplication['status']> = ref('all');

const pagination = {
	endpoint: 'admin/avatar-decoration-applications' as const,
	limit: 10,
	params: computed(() => ({
		status: status.value,
	})),
};

const reload = () => {
	avatarDecorationApplications.value?.paginator?.reload();
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
	title: i18n.ts._avatarDecorationApplication.title,
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
