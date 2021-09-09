/* eslint-disable @typescript-eslint/no-type-alias */

import { Messages } from "./messages";

export type MessageAlarmEvent =
	| Messages.systemArmed
	| Messages.systemDisarmed;
