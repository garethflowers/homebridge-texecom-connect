import { ConfigAccessory } from "../config/config-accessory";

export interface AccessoryContext<
	T extends ConfigAccessory = ConfigAccessory> {
	config: T;
}
