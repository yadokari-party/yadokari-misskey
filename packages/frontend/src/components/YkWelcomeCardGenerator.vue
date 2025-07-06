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
				<div :class="$style.generatedImage">
					<img v-if="generatedImage" :src="generatedImage" alt="Generated Card"/>
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
import { ref, onMounted, useTemplateRef, watchEffect } from 'vue';
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
const generatedImage = ref<string | null>(null);
const canvasEl = useTemplateRef<HTMLCanvasElement>('canvasEl');
const canvasGenerating = ref(true);

const shareText = `${i18n.ts._yadokari._welecomeCard.shareText}\n${window.location.origin}/@${$i.username}`;
const shareTextX = `${i18n.ts._yadokari._welecomeCard.shareTextX}\n${window.location.origin}/@${$i.username}`;

const userCreationCount = ref(0);

onMounted(() => {
	misskeyApi('i/creation-number').then((res) => {
		userCreationCount.value = res.order;
	}).then(() => {
		if (step.value === 'creation') {
			drawCard();
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

async function drawCard() {
	const canvas = canvasEl.value;
	if (!canvas) return;
	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	canvasGenerating.value = true;

	const fontface = new FontFace('JetBrains Mono', 'url(https://media.yadokari.party/assets/JetBrainsMono-VariableFont_wght.ttf)');

	// 背景画像を読み込む
	const bg = await loadImage('https://media.yadokari.party/assets/Yadokari-Boarding-Pass.png');
	canvas.width = 1188;
	canvas.height = 700;
	ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
	ctx.save();

	// ユーザーのアバターを描画
	const avatar = await loadImage($i.avatarUrl ?? '/static-assets/avatar.png');
	const AVATAR_X = 330;
	const AVATAR_Y = 250;
	const AVATAR_SIZE = 100;

	// 円形に整形
	ctx.beginPath();
	ctx.arc(AVATAR_X + AVATAR_SIZE / 2, AVATAR_Y + AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2);
	ctx.clip();
	ctx.drawImage(avatar, AVATAR_X, AVATAR_Y, AVATAR_SIZE, AVATAR_SIZE);
	ctx.restore();

	await fontface.load();
	window.document.fonts.add(fontface);

	//userの名前を描画
	ctx.fillStyle = '#000';
	ctx.font = '28px "JetBrains Mono", sans-serif';
	const name = editableName.value;
	const NAME_X = 455;
	const NAME_Y = 295;
	ctx.fillText(name, NAME_X, NAME_Y);

	//userのacctを描画
	const username = $i.username;
	const ACCT_X = 455;
	const ACCT_Y = 318;
	ctx.fillStyle = '#707070';
	ctx.font = '13px "JetBrains Mono", sans-serif';
	ctx.fillText(`@${username}@${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`, ACCT_X, ACCT_Y);

	//userの登録日
	const createdAt = new Date($i.createdAt);
	const CREATED_AT_X = 455;
	const CREATED_AT_Y = 400;
	ctx.fillStyle = '#000';
	ctx.font = '28px "JetBrains Mono", sans-serif';
	ctx.fillText(`${createdAt.getFullYear()}/${String(createdAt.getMonth() + 1).padStart(2, '0')}/${String(createdAt.getDate()).padStart(2, '0')}`, CREATED_AT_X, CREATED_AT_Y);

	//userの番号を描画
	const USER_CREATION_X = 650;
	const USER_CREATION_Y = 400;
	ctx.fillStyle = '#000';
	ctx.font = '28px "JetBrains Mono", sans-serif';
	ctx.fillText(String(userCreationCount.value).padStart(6, '0'), USER_CREATION_X, USER_CREATION_Y);

	//ログイン日数を描画
	const loggedInDays = $i.loggedInDays;
	const LOGGED_IN_DAYS_X = 750;
	const LOGGED_IN_DAYS_Y = 475;
	ctx.fillStyle = '#000';
	ctx.font = '28px "JetBrains Mono", sans-serif';
	ctx.textAlign = 'right';
	// 1日の時には"1 Day"、それ以外は"X Days"と表示
	if (loggedInDays === 1) {
		ctx.fillText('1 Day', LOGGED_IN_DAYS_X, LOGGED_IN_DAYS_Y);
	} else {
		ctx.fillText(`${loggedInDays.toLocaleString('en-US')} Days`, LOGGED_IN_DAYS_X, LOGGED_IN_DAYS_Y);
	}
	ctx.textAlign = 'left';

	//TODO: cheat実績を除外する
	//userの実績の数
	const archivements = $i.achievements./*filter(a => a.name !== 'cheat').*/length;
	const ACHIEVEMENTS_X = 915;
	const ACHIEVEMENTS_Y = 202;
	ctx.fillStyle = '#ff9797';
	ctx.font = '36px "JetBrains Mono", sans-serif';
	ctx.fillText(String(archivements).padStart(6, '0'), ACHIEVEMENTS_X, ACHIEVEMENTS_Y);

	canvasGenerating.value = false;
}

function dataURLtoBlob(dataurl: string) {
	const arr = dataurl.split(',');
	const mimeMatch = arr[0].match(/:(.*?);/);
	if (!mimeMatch) return null;
	const mime = mimeMatch[1];
	const bstr = atob(arr[1]);
	let n = bstr.length;
	const u8arr = new Uint8Array(n);
	while (n--) {
		u8arr[n] = bstr.charCodeAt(n);
	}
	return new Blob([u8arr], { type: mime });
}

async function postNote() {
	if (!generatedImage.value) return;

	const blob = dataURLtoBlob(generatedImage.value);
	if (!blob) return;

	const formData = new FormData();
	formData.append('file', blob);
	formData.append('name', `yadokari-welcome-card-${$i.username}-${new Date().getTime()}.png`);
	formData.append('isSensitive', 'false');
	formData.append('i', $i.token);
	if (prefer.s.uploadFolder) {
		formData.append('folderId', prefer.s.uploadFolder);
	}

	window.fetch(apiUrl + '/drive/files/create', {
		method: 'POST',
		body: formData,
	})
		.then(response => response.json()).then(file => {
			os.post({
				initialVisibility: 'public',
				initialFiles: [file],
				initialText: shareText,
			});
		}).catch(error => {
			os.alert({
				title: i18n.ts.error,
				type: 'error',
			});
		});
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
	if (!generatedImage.value) return;
	const blob = dataURLtoBlob(generatedImage.value);
	if (!blob) return;

	const link = window.document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = `yadokari-welcome-card-${$i.username}-${new Date().getTime()}.png`;
	window.document.body.appendChild(link);
	link.click();
	window.document.body.removeChild(link);
	URL.revokeObjectURL(link.href);
}

async function toSharePage() {
	if (!canvasEl.value) return;
	await drawCard();
	generatedImage.value = canvasEl.value.toDataURL('image/png');
	step.value = 'share';
}

function cancel() {
	emit('cancelled');
	dialogEl.value?.close();
}

watchEffect(async () => {
	if (step.value !== 'creation' || !canvasEl.value) {
		return;
	}

	if (generatedImage.value) {
		const canvas = canvasEl.value;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		canvasGenerating.value = true;
		const img = await loadImage(generatedImage.value);
		canvas.width = img.width;
		canvas.height = img.height;
		ctx.drawImage(img, 0, 0);
		canvasGenerating.value = false;
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

//横並びレイアウトにしたい
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
