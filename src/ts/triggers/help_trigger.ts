import { Trigger } from "./trigger";
import { AudioManager } from "../audio";
import { state } from "../state";

/** A help trigger displays an info message when the player touches one. */
export class HelpTrigger extends Trigger {
	sounds = ['infotutorial.wav'];

	onMarbleEnter() {
		state.menu.hud.displayHelp(this.element.text, true);
		this.level.replay.recordMarbleEnter(this);
	}
}