import { PowerUp } from "./power_up";
import * as THREE from "three";
import { Util } from "../util";
import { TimeState } from "../level";
import { AudioManager } from "../audio";
import { state } from "../state";
import { MissionElementItem } from "../parsing/mis_parser";

/** Changes the gravity on pickup. */
export class AntiGravity extends PowerUp {
	dtsPath = "shapes/items/antigravity.dts";
	autoUse = true;
	pickUpName = (state.modification === 'gold')? "Gravity Modifier" : "Gravity Defier";
	sounds = ["gravitychange.wav"];

	constructor(element: MissionElementItem, respawnInstantly = false) {
		super(element);

		if (respawnInstantly) this.cooldownDuration = -Infinity;
	}

	pickUp() {
		let direction = new THREE.Vector3(0, 0, -1);
		direction.applyQuaternion(this.worldOrientation);
		return !Util.isSameVector(direction, this.level.currentUp);
	}

	use(time: TimeState) {
		// Determine the new up vector
		let direction = new THREE.Vector3(0, 0, -1);
		direction.applyQuaternion(this.worldOrientation);

		this.level.setUp(Util.vecThreeToOimo(direction), time);
		AudioManager.play(this.sounds[0]);
	}
}