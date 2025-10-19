import { UnknownContext } from "homebridge";

import { ConfigAccessory } from "../config/config-accessory";

export interface AccessoryContext<
	T extends ConfigAccessory = ConfigAccessory> extends UnknownContext {
	config: T;
}
