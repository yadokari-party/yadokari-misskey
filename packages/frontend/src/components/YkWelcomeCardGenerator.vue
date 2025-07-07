<!--
SPDX-FileCopyrightText: 3-x-3 and team-yadokari
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<MkModalWindow
	ref="dialogEl"
	:width="1000"
	:height="600"
	:scroll="false"
	:withOkButton="false"
	@close="cancel"
	@closed="$emit('closed')"
	@esc="cancel"
>
	<template #header>
		<i class="ti ti-balloon"></i>
		<span>{{ i18n.ts._yadokari._welecomeCard.title }}</span>
	</template>
	<div :class="$style.root">
		<Transition name="fade" mode="out-in">
			<!-- Step 1: Card Creation -->
			<div v-if="step === 'creation'" key="creation" :class="$style.container">
				<div :class="$style.previewPage">
					<div :class="$style.preview">
						<div inert :class="$style.welcomeCanvasWrapper">
							<div :class="$style.previewPane"><i class="ti ti-eye"></i> {{ i18n.ts.preview }}</div>
							<MkLoading v-if="canvasGenerating" :class="$style.loading"/>
							<canvas ref="canvasEl" key="welcomeCanvas" :class="$style.welcomeCanvas"></canvas>
						</div>
					</div>
					<div class="_gaps_s">
						<MkInput
							v-model="editableName"
						>
							<template #label>{{ i18n.ts.name }}</template>
						</MkInput>
						<span :class="$style.editNameDescription">{{ i18n.ts._yadokari._welecomeCard.editNameDescription }}</span>
						<div :class="$style.buttons">
							<MkButton
								:disabled="canvasGenerating"
								@click="drawCard"
							>
								{{ i18n.ts._yadokari._welecomeCard.applyToPreview }}
							</MkButton>
							<MkButton
								primary
								:disabled="canvasGenerating"
								@click="toSharePage"
							>
								{{ i18n.ts._yadokari._welecomeCard.shareImage }}
							</MkButton>
						</div>
					</div>
				</div>
			</div>

			<!-- Step 2: Share Image -->
			<div v-else key="share" :class="$style.container">
				<div :class="$style.doneMark">
					<i class="ti ti-check"></i>
				</div>
				<div :class="$style.shareTitle">{{ i18n.ts._yadokari._welecomeCard.cardGenerated }}</div>
				<div :class="$style.shareDescription">{{ i18n.ts._yadokari._welecomeCard.cardGeneratedDescription }}</div>
				<div v-if="generatedImage" :class="$style.generatedImage">
					<img :src="generatedImage.url" alt="Generated Card"/>
				</div>
				<div :class="$style.buttons">
					<MkButton rounded @click="postNote"><i class="ti ti-pencil"></i> {{ i18n.ts.note }}</MkButton>
					<MkButton rounded @click="download"><i class="ti ti-download"></i> {{ i18n.ts.download }}</MkButton>
					<MkButton rounded @click="postX"><i class="ti ti-brand-x"></i> {{ i18n.ts._yadokari._welecomeCard.postToX }}</MkButton>
					<MkButton rounded @click="postOtherMisskey"><i class="ti ti-share"></i> {{ i18n.ts._yadokari._welecomeCard.shareToOtherMisskey }}</MkButton>
				</div>
				<div :class="$style.shareWarning">
					{{ i18n.ts._yadokari._welecomeCard.shareWarning }}
				</div>
				<div :class="$style.buttons">
					<MkButton rounded transparent @click="step = 'creation'">
						<i class="ti ti-arrow-left"></i> {{ i18n.ts.goBack }}
					</MkButton>
					<MkButton rounded transparent @click="cancel">
						<i class="ti ti-x"></i> {{ i18n.ts.close }}
					</MkButton>
				</div>
			</div>
		</Transition>
	</div>
</MkModalWindow>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, useTemplateRef, watch } from 'vue';
import { apiUrl } from '@@/js/config.js';
import { ensureSignin } from '@/i.js';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/utility/misskey-api';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import { prefer } from '@/preferences';
import * as os from '@/os.js';

const $i = ensureSignin();

const emit = defineEmits<{
	(ev: 'cancelled'): void;
	(ev: 'completed'): void;
	(ev: 'closed'): void;
}>();

const dialogEl = useTemplateRef('dialogEl');

const step = ref<'creation' | 'share'>('creation');
const editableName = ref($i.name ?? $i.username);
const generatedImage = ref<{ blob: Blob, url: string } | null>(null);
const canvasEl = useTemplateRef<HTMLCanvasElement>('canvasEl');
const canvasGenerating = ref(true);

const shareText = `${i18n.ts._yadokari._welecomeCard.shareText}\n${window.location.origin}/@${$i.username}`;
const shareTextX = `${i18n.ts._yadokari._welecomeCard.shareTextX}\n${window.location.origin}/@${$i.username}`;

const userCreationCount = ref(0);

onMounted(async () => {
	try {
		const res = await misskeyApi('i/creation-number');
		userCreationCount.value = res.order;
		// 初回描画
		await drawCard();
	} catch (error) {
		console.error('Failed to initialize card generator:', error);
		os.alert({
			title: i18n.ts.error,
			text: i18n.ts._yadokari._welecomeCard.generationFailed,
			type: 'error',
		});
		cancel(); // Close dialog on initialization failure
	}

	onUnmounted(() => {
		if (generatedImage.value) {
			URL.revokeObjectURL(generatedImage.value.url);
		}
	});
});

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => resolve(img);
		img.onerror = (error) => reject(error);
		img.src = src;
	});
}

const CARD_CONFIG = {
	width: 1188,
	height: 700,
	fontUrl: 'https://media.yadokari.party/assets/JetBrainsMono-VariableFont_wght.ttf',
	fontFamily: '"JetBrains Mono", sans-serif',
	backgroundImageUrl: 'https://media.yadokari.party/assets/Yadokari-Boarding-Pass.png',
	avatar: { x: 330, y: 250, size: 100 },
	name: { x: 455, y: 295, font: '28px', color: '#000' },
	acct: { x: 455, y: 318, font: '13px', color: '#707070' },
	createdAt: { x: 455, y: 400, font: '28px', color: '#000' },
	userCreation: { x: 650, y: 400, font: '28px', color: '#000' },
	loggedInDays: { x: 750, y: 475, font: '28px', color: '#000' },
	achievements: { x: 915, y: 202, font: '36px', color: '#ff9797' },
};

/**
 * Canvasにウェルカムカードを描画するヘルパー関数
 * @param ctx Canvasの2Dコンテキスト
 * @param data 描画に必要なデータ
 */
async function drawWelcomeCardOnCanvas(ctx: CanvasRenderingContext2D, data: {
	name: string;
	username: string;
	avatarUrl: string | null;
	createdAt: string;
	userCreationCount: number;
	loggedInDays: number;
	achievementsCount: number;
}) {
	// フォントと画像を並行して読み込む
	const [fontface, bg, avatar] = await Promise.all([
		new FontFace('JetBrains Mono', `url(${CARD_CONFIG.fontUrl})`).load(),
		loadImage(CARD_CONFIG.backgroundImageUrl),
		loadImage(data.avatarUrl ?? '/static-assets/avatar.png'),
	]);

	window.document.fonts.add(fontface);

	// 背景
	ctx.canvas.width = CARD_CONFIG.width;
	ctx.canvas.height = CARD_CONFIG.height;
	ctx.drawImage(bg, 0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.save();

	// アバター
	ctx.beginPath();
	ctx.arc(CARD_CONFIG.avatar.x + CARD_CONFIG.avatar.size / 2, CARD_CONFIG.avatar.y + CARD_CONFIG.avatar.size / 2, CARD_CONFIG.avatar.size / 2, 0, Math.PI * 2);
	ctx.clip();
	ctx.drawImage(avatar, CARD_CONFIG.avatar.x, CARD_CONFIG.avatar.y, CARD_CONFIG.avatar.size, CARD_CONFIG.avatar.size);
	ctx.restore();

	// 名前
	ctx.fillStyle = CARD_CONFIG.name.color;
	ctx.font = `${CARD_CONFIG.name.font} ${CARD_CONFIG.fontFamily}`;
	ctx.fillText(data.name, CARD_CONFIG.name.x, CARD_CONFIG.name.y);

	// Acct
	ctx.fillStyle = CARD_CONFIG.acct.color;
	ctx.font = `${CARD_CONFIG.acct.font} ${CARD_CONFIG.fontFamily}`;
	ctx.fillText(`@${data.username}@${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`, CARD_CONFIG.acct.x, CARD_CONFIG.acct.y);

	// 登録日
	const createdAtDate = new Date(data.createdAt);
	ctx.fillStyle = CARD_CONFIG.createdAt.color;
	ctx.font = `${CARD_CONFIG.createdAt.font} ${CARD_CONFIG.fontFamily}`;
	ctx.fillText(`${createdAtDate.getFullYear()}/${String(createdAtDate.getMonth() + 1).padStart(2, '0')}/${String(createdAtDate.getDate()).padStart(2, '0')}`, CARD_CONFIG.createdAt.x, CARD_CONFIG.createdAt.y);

	// 登録番号
	ctx.fillStyle = CARD_CONFIG.userCreation.color;
	ctx.font = `${CARD_CONFIG.userCreation.font} ${CARD_CONFIG.fontFamily}`;
	ctx.fillText(String(data.userCreationCount).padStart(6, '0'), CARD_CONFIG.userCreation.x, CARD_CONFIG.userCreation.y);

	// 実績
	ctx.fillStyle = CARD_CONFIG.achievements.color;
	ctx.font = `${CARD_CONFIG.achievements.font} ${CARD_CONFIG.fontFamily}`;
	ctx.fillText(String(data.achievementsCount).padStart(6, '0'), CARD_CONFIG.achievements.x, CARD_CONFIG.achievements.y);

	// ログイン日数 (右寄せ)
	ctx.save();
	const loggedInDaysText = data.loggedInDays === 1 ? '1 Day' : `${data.loggedInDays.toLocaleString('en-US')} Days`;
	ctx.fillStyle = CARD_CONFIG.loggedInDays.color;
	ctx.font = `${CARD_CONFIG.loggedInDays.font} ${CARD_CONFIG.fontFamily}`;
	ctx.textAlign = 'right';
	ctx.fillText(loggedInDaysText, CARD_CONFIG.loggedInDays.x, CARD_CONFIG.loggedInDays.y);
	ctx.restore();
}

async function drawCard() {
	const canvas = canvasEl.value;
	if (!canvas) return;
	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	canvasGenerating.value = true;

	try {
		await drawWelcomeCardOnCanvas(ctx, {
			name: editableName.value,
			username: $i.username,
			avatarUrl: $i.avatarUrl,
			createdAt: $i.createdAt,
			userCreationCount: userCreationCount.value,
			loggedInDays: $i.loggedInDays,
			//TODO: cheat実績を除外する
			achievementsCount: $i.achievements.length,
		});
	} catch (error) {
		console.error('Failed to draw welcome card:', error);
		os.alert({
			title: i18n.ts.error,
			// Consider adding a specific i18n key for this message
			text: i18n.ts._yadokari._welecomeCard.generationFailed ?? 'Failed to generate the card. Please try again.',
			type: 'error',
		});
	} finally {
		canvasGenerating.value = false;
	}
}

function generateFilename(): string {
	return `yadokari-welcome-card-${$i.username}-${new Date().getTime()}.png`;
}

async function postNote() {
	if (!generatedImage.value?.blob) return;

	try {
		const formData = new FormData();
		formData.append('file', generatedImage.value.blob);
		formData.append('name', generateFilename());
		formData.append('isSensitive', 'false');
		formData.append('i', $i.token);
		if (prefer.s.uploadFolder) {
			formData.append('folderId', prefer.s.uploadFolder);
		}

		const response = await window.fetch(apiUrl + '/drive/files/create', {
			method: 'POST',
			body: formData,
		});
		const file = await response.json();

		os.post({
			initialVisibility: 'public',
			initialFiles: [file],
			initialText: shareText,
		});
	} catch (error) {
		console.error('Failed to post note:', error);
		os.alert({
			title: i18n.ts.error,
			text: i18n.ts._yadokari._welecomeCard.uploadAndNoteFailed,
			type: 'error',
		});
	}
}

function postX() {
	const url = `https://x.com/intent/tweet?text=${encodeURIComponent(shareTextX)}`;
	window.open(
		url,
		'_blank',
		'noopener,noreferrer',
	);
}

function postOtherMisskey() {
	window.open(
		`https://misskey-hub.net/share?text=${encodeURIComponent(shareText)}`,
		'_blank',
		'noopener,noreferrer',
	);
}

function download() {
	if (!generatedImage.value?.url) return;

	const link = window.document.createElement('a');
	link.href = generatedImage.value.url;
	link.download = generateFilename();
	window.document.body.appendChild(link);
	link.click();
	window.document.body.removeChild(link);
}

async function toSharePage() {
	const canvas = canvasEl.value;
	if (!canvas) return;

	// 既存のオブジェクトURLがあれば無効化してメモリリークを防ぐ
	if (generatedImage.value) {
		URL.revokeObjectURL(generatedImage.value.url);
	}

	//await drawCard(); // 最終描画

	const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
	if (!blob) {
		// 既存のi18nキーを再利用
		os.alert({ title: i18n.ts.error, text: i18n.ts._yadokari._welecomeCard.generationFailed ?? 'Failed to generate the card.', type: 'error' });
		return;
	}

	generatedImage.value = { blob, url: URL.createObjectURL(blob) };
	step.value = 'share';
}

function cancel() {
	emit('cancelled');
	dialogEl.value?.close();
}

watch([step, canvasEl], async ([newStep, newCanvas]) => {
	// 'share'ページから'creation'ページに戻ってきた時に、
	// canvas要素が利用可能になったら、生成済みの画像を再描画する
	if (newStep === 'creation' && newCanvas && generatedImage.value?.url) {
		const ctx = newCanvas.getContext('2d');
		if (!ctx) return;

		canvasGenerating.value = true;
		try {
			const img = await loadImage(generatedImage.value.url);
			newCanvas.width = img.width;
			newCanvas.height = img.height;
			ctx.drawImage(img, 0, 0);
		} catch (error) {
			console.error('Failed to redraw image:', error);
			os.alert({
				title: i18n.ts.error,
				text: i18n.ts._yadokari._welecomeCard.generationFailed,
				type: 'error',
			});
		} finally {
			canvasGenerating.value = false;
		}
	}
});

</script>
<style module lang="scss">
.root {
	height: 100%;
}

.container {
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	padding: 20px;
}

//横並びレイアウトにしたい gridにしよう
.previewPage {
	margin: -20px;
	padding: 20px;
	display: grid;
	grid-template-columns: 1.5fr 1fr;
	grid-gap: 20px;
	height: 100%;
}
// 収まらないときは1列に
@media (max-width: 800px) {
	.previewPage {
		grid-template-columns: 1fr;
	}
}

.preview {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	cursor: not-allowed;
}

.loading {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}

.previewPane {
	position: absolute;
	top: 0px;
	left: 0px;
}

.welcomeCanvasWrapper {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	position: relative;
}

.welcomeCanvas {
	width: 100%;
	height: auto;
}

.editNameDescription {
	font-size: 0.85em;
}

.buttons {
	display: flex;
	gap: 10px;
	margin: 5px 0;
	flex-wrap: wrap;
	justify-content: center;
}

.doneMark {
	margin: 0 auto;
	border-radius: 50%;
	background-color: var(--MI_THEME-accentedBg);
	text-align: center;
	font-size: 24px;
	color: var(--MI_THEME-accent);
	width: 64px;
	height: 64px;
	line-height: 64px;
}

.generatedImage {
	text-align: center;

	& > img {
		max-width: 400px;
		width: 100%;
		object-fit: contain;
	}

	@media screen and (max-width: 800px) {
		& > img {
			max-width: 60%;
		}
	}
}
.shareTitle {
	margin: 10px 0;
	font-size: 1.25em;
	text-align: center;
}

.shareDescription {
	margin: 10px 0;
	text-align: center;
}

.shareWarning {
	margin: 10px 0;
	font-size: 0.8em;
	font-weight: lighter;
	opacity: .7;
	text-align: center;
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
