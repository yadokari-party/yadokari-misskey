<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" :preferType="'dialog'" :zPriority="'high'" @click="done(true)" @closed="emit('closed')" @esc="cancel()">
	<div :class="$style.root">
		<div v-if="icon" :class="$style.icon">
			<i :class="icon"></i>
		</div>
		<div
			v-else-if="!input && !select"
			:class="[$style.icon, {
				[$style.type_success]: type === 'success',
				[$style.type_error]: type === 'error',
				[$style.type_warning]: type === 'warning',
				[$style.type_info]: type === 'info',
			}]"
		>
			<i v-if="type === 'success'" :class="$style.iconInner" class="ti ti-check"></i>
			<i v-else-if="type === 'error'" :class="$style.iconInner" class="ti ti-circle-x"></i>
			<i v-else-if="type === 'warning'" :class="$style.iconInner" class="ti ti-alert-triangle"></i>
			<i v-else-if="type === 'info'" :class="$style.iconInner" class="ti ti-info-circle"></i>
			<i v-else-if="type === 'question'" :class="$style.iconInner" class="ti ti-help-circle"></i>
			<MkLoading v-else-if="type === 'waiting'" :class="$style.iconInner" :em="true"/>
		</div>
		<header v-if="title" :class="$style.title"><Mfm :text="title"/></header>
		<div v-if="text" :class="$style.text"><Mfm :text="text"/></div>
		<MkInput v-if="input" v-model="inputValue" autofocus :type="input.type || 'text'" :placeholder="input.placeholder || undefined" :autocomplete="input.autocomplete" @keydown="onInputKeydown">
			<template v-if="input.type === 'password'" #prefix><i class="ti ti-lock"></i></template>
			<template #caption>
				<span v-if="okButtonDisabledReason === 'charactersExceeded'" v-text="i18n.tsx._dialog.charactersExceeded({ current: (inputValue as string)?.length ?? 0, max: input.maxLength ?? 'NaN' })"/>
				<span v-else-if="okButtonDisabledReason === 'charactersBelow'" v-text="i18n.tsx._dialog.charactersBelow({ current: (inputValue as string)?.length ?? 0, min: input.minLength ?? 'NaN' })"/>
			</template>
		</MkInput>
		<MkSelect v-if="select" v-model="selectedValue" autofocus>
			<template v-if="select.items">
				<template v-for="item in select.items">
					<optgroup v-if="'sectionTitle' in item" :label="item.sectionTitle">
						<option v-for="subItem in item.items" :value="subItem.value">{{ subItem.text }}</option>
					</optgroup>
					<option v-else :value="item.value">{{ item.text }}</option>
				</template>
			</template>
		</MkSelect>
		<MkSwitch v-if="switchLabel" v-model="switchValue" style="display: flex; margin: 1em 0; justify-content: center;">{{ switchLabel }}</MkSwitch>
		<div v-if="(showOkButton || showCancelButton) && !actions" :class="$style.buttons">
			<MkButton v-if="showOkButton" data-cy-modal-dialog-ok inline primary rounded :autofocus="!input && !select" :disabled="okDisabled || okButtonDisabledReason != null" @click="ok">{{ okText ?? ((showCancelButton || input || select) ? i18n.ts.ok : i18n.ts.gotIt) }}<span v-if="okDisabled && okWaitInitiated"> ({{ sec }})</span></MkButton>
			<MkButton v-if="showCancelButton || input || select" data-cy-modal-dialog-cancel inline rounded @click="cancel">{{ cancelText ?? i18n.ts.cancel }}</MkButton>
		</div>
		<div v-if="actions" :class="$style.buttons">
			<MkButton v-for="action in actions" :key="action.text" inline rounded :primary="action.primary" :danger="action.danger" @click="() => { action.callback(); modal?.close(); }">{{ action.text }}</MkButton>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { ref, shallowRef, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import MkModal from '@/components/MkModal.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import { i18n } from '@/i18n.js';

type Input = {
	type?: 'text' | 'number' | 'password' | 'email' | 'url' | 'date' | 'time' | 'search' | 'datetime-local';
	placeholder?: string | null;
	autocomplete?: string;
	default: string | number | null;
	minLength?: number;
	maxLength?: number;
};

type SelectItem = {
	value: any;
	text: string;
};

type Select = {
	items: (SelectItem | {
		sectionTitle: string;
		items: SelectItem[];
	})[];
	default: string | null;
};

type Result = string | number | true | null;

const props = withDefaults(defineProps<{
	type?: 'success' | 'error' | 'warning' | 'info' | 'question' | 'waiting';
	title?: string;
	text?: string;
	input?: Input;
	select?: Select;
	switchLabel?: string | null;
	icon?: string;
	actions?: {
		text: string;
		primary?: boolean,
		danger?: boolean,
		callback: (...args: unknown[]) => void;
	}[];
	showOkButton?: boolean;
	showCancelButton?: boolean;
	cancelableByBgClick?: boolean;
	okText?: string;
	okWaitInitiate?: 'dialog' | 'input' | 'switch';
	okWaitDuration?: number;
	cancelText?: string;
}>(), {
	type: 'info',
	icon: undefined,
	title: undefined,
	text: undefined,
	input: undefined,
	select: undefined,
	switchLabel: undefined,
	details: undefined,
	actions: undefined,
	showOkButton: true,
	showCancelButton: false,
	cancelableByBgClick: true,
	okText: undefined,
	okWaitInitiate: undefined,
	okWaitDuration: 0,
	cancelText: undefined,
});

const emit = defineEmits<{
	(ev: 'done', v: { canceled: true } | { canceled: false, result: Result, toggle: boolean }): void;
	(ev: 'closed'): void;
}>();

const modal = shallowRef<InstanceType<typeof MkModal>>();

const inputValue = ref<string | number | null>(props.input?.default ?? null);
const selectedValue = ref(props.select?.default ?? null);
const switchValue = ref<boolean>(false);

const sec = ref(props.okWaitDuration);
const okWaitInitiated = computed(() => {
	if (props.okWaitInitiate === 'dialog') return true;
	if (props.okWaitInitiate === 'input') return inputValue.value !== null;
	if (props.okWaitInitiate === 'switch') return switchValue.value;
	return false;
});
const okDisabled = computed(() => sec.value > 0);

const okButtonDisabledReason = computed<null | 'charactersExceeded' | 'charactersBelow'>(() => {
	if (props.input) {
		if (props.input.minLength) {
			if (inputValue.value == null || (inputValue.value as string).length < props.input.minLength) {
				return 'charactersBelow';
			}
		}
		if (props.input.maxLength) {
			if (inputValue.value && (inputValue.value as string).length > props.input.maxLength) {
				return 'charactersExceeded';
			}
		}
	}

	return null;
});

// overload function を使いたいので lint エラーを無視する
function done(canceled: true): void;
function done(canceled: false, result: Result, toggle: boolean): void; // eslint-disable-line no-redeclare
function done(canceled: boolean, result?: Result, toggle?: boolean ): void { // eslint-disable-line no-redeclare
	emit('done', { canceled, result, toggle } as { canceled: true } | { canceled: false, result: Result, toggle: boolean });
	modal.value?.close();
}

async function ok() {
	if (!props.showOkButton) return;

	const result =
		props.input ? inputValue.value :
		props.select ? selectedValue.value :
		true;
	done(false, result, switchValue.value);
}

function cancel() {
	done(true);
}

function onKeydown(evt: KeyboardEvent) {
	if (evt.key === 'Escape') cancel();
}

function onInputKeydown(evt: KeyboardEvent) {
	if (evt.key === 'Enter' && okButtonDisabledReason.value === null) {
		evt.preventDefault();
		evt.stopPropagation();
		ok();
	}
}

watch(okWaitInitiated, () => {
	sec.value = props.okWaitDuration;
});

onMounted(() => {
	document.addEventListener('keydown', onKeydown);

	sec.value = props.okWaitDuration;
	if (sec.value > 0) {
		const waitTimer = setInterval(() => {
			if (!okWaitInitiated.value) return;

			if (sec.value < 0) {
				clearInterval(waitTimer);
			}
			sec.value = sec.value - 1;
		}, 1000);
	}
});

onBeforeUnmount(() => {
	document.removeEventListener('keydown', onKeydown);
});
</script>

<style lang="scss" module>
.root {
	position: relative;
	margin: auto;
	padding: 32px;
	min-width: 320px;
	max-width: 480px;
	box-sizing: border-box;
	text-align: center;
	background: var(--MI_THEME-panel);
	border-radius: 16px;
}

.icon {
	font-size: 24px;

	& + .title {
		margin-top: 8px;
	}
}

.iconInner {
	display: block;
	margin: 0 auto;
}

.type_info {
	color: #55c4dd;
}

.type_success {
	color: var(--MI_THEME-success);
}

.type_error {
	color: var(--MI_THEME-error);
}

.type_warning {
	color: var(--MI_THEME-warn);
}

.title {
	margin: 0 0 8px 0;
	font-weight: bold;
	font-size: 1.1em;

	& + .text {
		margin-top: 8px;
	}
}

.text {
	margin: 16px 0 0 0;
}

.buttons {
	margin-top: 16px;
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	justify-content: center;
}
</style>
