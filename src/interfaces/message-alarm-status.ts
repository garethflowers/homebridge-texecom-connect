import { MessageAlarmEvent } from "./message-alarm-event";

export interface MessageAlarmStatus {
	event: MessageAlarmEvent;
	state: boolean;
}
