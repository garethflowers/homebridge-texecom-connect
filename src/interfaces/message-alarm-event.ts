import { Messages } from "./messages";

export type MessageAlarmEvent =
	| Messages.systemArmed
	| Messages.systemDisarmed;
