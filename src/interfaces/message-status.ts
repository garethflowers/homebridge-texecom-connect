import { MessageStatusEvent } from "./message-status-event";

export interface MessageStatus {
	event: MessageStatusEvent;
	state: boolean;
}
