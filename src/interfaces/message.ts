import { MessageAlarmStatus } from "./message-alarm-status";
import { MessageStatus } from "./message-status";

export type Message =
	| MessageAlarmStatus
	| MessageStatus;
