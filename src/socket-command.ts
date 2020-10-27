import { SocketCommandAction } from "./socket-command-action";

export interface SocketCommand {

	action: SocketCommandAction;

	id: string;

	value: number;

}
