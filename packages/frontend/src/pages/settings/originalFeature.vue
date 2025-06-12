<!--
SPDX-FileCopyrightText: chan-mai
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker
	path="/settings/shahu-settings" :label="i18n.ts.originalFeature"
	:keywords="['originalFeature', 'preferences']" icon="ti ti-adjustments"
	markerId="shahu-settings"
>
	<div class="_gaps_m">
		<MkFeatureBanner icon="/client-assets/gear_3d.png" color="#7f6666">
			<SearchKeyword>{{ i18n.ts.originalFeature }}</SearchKeyword>
		</MkFeatureBanner>

		<SearchMarker :label="i18n.ts.display">
			<FormSection>
				<template #label>{{ i18n.ts.display }}</template>

				<div class="_gaps_m">
					<SearchMarker :label="i18n.ts.customFont">
						<MkFolder>
							<template #icon><i class="ti ti-typography"></i></template>
							<template #label>
								{{ i18n.ts.customFont }}<span class="_beta">{{ i18n.ts.originalFeature
								}}</span>
							</template>
							<template v-if="appearanceSettingsForm.modified.value" #footer>
								<MkFormFooter :form="appearanceSettingsForm"/>
							</template>

							<div class="_gaps_m">
								<MkPreferenceContainer k="customFont">
									<MkSelect v-model="appearanceSettingsForm.state.customFont">
										<template #label>{{ i18n.ts.customFont }}</template>
										<option :value="null">{{ i18n.ts.default }}</option>
										<option v-for="[name, font] of Object.entries(fontList)" :key="name" :value="name">{{ font.name }}</option>
									</MkSelect>
								</MkPreferenceContainer>
							</div>
						</MkFolder>
					</SearchMarker>
				</div>
			</FormSection>
		</SearchMarker>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkSelect from '@/components/MkSelect.vue';
import MkFolder from '@/components/MkFolder.vue';
import FormSection from '@/components/form/section.vue';
import MkFormFooter from '@/components/MkFormFooter.vue';
import { prefer } from '@/preferences.js';
import { reloadAsk } from '@/utility/reload-ask.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { fontList } from '@/utility/font';
import MkFeatureBanner from '@/components/MkFeatureBanner.vue';
import MkPreferenceContainer from '@/components/MkPreferenceContainer.vue';
import { useForm } from '@/composables/use-form';

const appearanceSettingsForm = useForm({
	customFont: prefer.s.customFont,
}, async (state) => {
	prefer.commit('customFont', state.customFont);
	await reloadAsk({ reason: i18n.ts.reloadToApplySetting, unison: true });
});

const headerActions = computed(() => []);
const headerTabs = computed(() => []);

definePage(() => ({
	title: 'shahu-fork',
	icon: 'ti ti-adjustments',
}));
</script>
<style lang="scss" module>
.items {
	padding: 8px;
	flex: 1;
	display: grid;
	grid-auto-flow: row;
	grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
	grid-auto-rows: 40px;
}

.item {
	display: inline-block;
	padding: 0;
	margin: 0;
	font-size: 1em;
	width: auto;
	height: 100%;
	border-radius: 6px;

	&:hover {
		background: var(--X5);
	}
}

.label {
	font-size: 0.85em;
	padding: 0 0 8px 0;
	user-select: none;
}
</style>
