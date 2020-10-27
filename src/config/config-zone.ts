import { ConfigAccessory } from "./config-accessory";

export interface ConfigZone
	extends ConfigAccessory {

	accessory:
	| "carbon-monoxide"
	| "contact"
	| "motion"
	| "smoke";

}
