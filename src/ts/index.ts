import './input';
import OIMO from "./declarations/oimo";
import { ResourceManager } from "./resources";
import * as THREE from "three";
import { AudioManager } from "./audio";
import { StorageManager } from './storage';
import { Util } from './util';
import { Leaderboard } from './leaderboard';
import { MissionLibrary } from './mission_library';
import { state } from './state';
import { setMenu } from './ui/menu_setter';

OIMO.Setting.defaultGJKMargin = 0.005; // Without this, the marble is very visibly floating above stuff.
OIMO.Setting.defaultContactPositionCorrectionAlgorithm = OIMO.PositionCorrectionAlgorithm.NGS; // Slower, but there's really only one collision object anyway so
THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);

const loadingMessage = document.querySelector('#loading-message') as HTMLDivElement;
const loadingDetail = document.querySelector('#loading-detail') as HTMLDivElement;
const startGameDialog = document.querySelector('#start-game-dialog') as HTMLDivElement;

const init = async () => {
	await Util.init();
	await StorageManager.init();
	await ResourceManager.init();

	loadingDetail.textContent = 'Loading levels...';
	await MissionLibrary.init();
	AudioManager.init();

	loadingDetail.textContent = 'Loading UI...';
	await setMenu(StorageManager.data.modification);

	loadingDetail.textContent = 'Loading leaderboard...';
	await Leaderboard.init();

	let started = false;
	const start = async () => {
		started = true;
		startGameDialog.style.display = 'none';
		AudioManager.context.resume();
		state.menu.show();
	};
	
	loadingMessage.style.display = 'none';
	loadingDetail.style.display = 'none';
	if (AudioManager.context.state === "running") {
		// Start the game automatically if we already have audio autoplay permission.
		start();
		return;
	}

	// Otherwise, we need user interaction to start audio.
	
	if (Util.isInFullscreen()) {
		// No need to tell them to enter fullscreen if they're already in it
		startGameDialog.children[0].textContent = 'Click anywhere to start';
		startGameDialog.children[1].textContent = '';
	} else {
		startGameDialog.children[0].textContent = `Press ${Util.isMac()? '^⌘F' : 'F11'} to start in fullscreen mode`;
	}
	startGameDialog.style.display = 'block';
	
	window.addEventListener('mousedown', () => {
		if (started) return;
		start();
	});
	window.addEventListener('keydown', (e) => {
		if (started) return;
		if (e.code === 'F11' && !Util.isInFullscreen()) start();
	});
};
window.onload = init;

let errorTimeout: number = null;
// Keep track all errors
let errorQueue: {
	message: string,
	lineno: number,
	colno: number,
	filename: string
}[] = [];
window.addEventListener('error', (e) => {
	errorQueue.push({
		message: (e.error as Error).stack,
		lineno: e.lineno,
		colno: e.colno,
		filename: e.filename
	});
	if (errorTimeout === null) sendErrors();
});
window.addEventListener('unhandledrejection', (e) => {
	errorQueue.push({
		message: e.reason instanceof Error ? e.reason.stack : e.reason.toString(),
		lineno: 0,
		colno: 0,
		filename: 'Unhandled in Promise'
	});
	if (errorTimeout === null) sendErrors();
});

/** Sends an error report to the server. */
const sendErrors = () => {
	errorTimeout = null;
	if (errorQueue.length === 0) return;

	let errors: {
		message: string,
		line: number,
		column: number,
		filename: string
	}[] = [];

	errorQueue.length = Math.min(errorQueue.length, 16); // Cap it at 16 errors, we don't wanna be sending too much
	for (let event of errorQueue) {
		errors.push({
			message: event.message,
			line: event.lineno,
			column: event.colno,
			filename: event.filename
		});
	}
	errorQueue.length = 0;

	if (errors.length > 0) {
		fetch('./api/error', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				userAgent: navigator.userAgent,
				errors: errors
			})
		});
	}

	// 5-second timeout until it's done again
	errorTimeout = setTimeout(sendErrors, 5000) as any as number;
};

const activityId = Util.getRandomId();
setInterval(() => {
	fetch('/api/activity?id=' + activityId);
}, 30000);