/* eslint-disable @typescript-eslint/no-type-alias */

import { Messages } from "./messages";

export type MessageStatusEvent =
	| Messages.armingUpdate
	| Messages.armUpdate
	| Messages.disarmUpdate
	| Messages.entryUpdate
	| Messages.intruderUpdate
	| Messages.userPinLogin
	| Messages.userTagLogin
	| Messages.zoneUpdate;
