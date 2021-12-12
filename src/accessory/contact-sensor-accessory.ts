import { CharacteristicValue, PlatformAccessory } from "homebridge";

import { ConfigZone } from "../config/config-zone";
import { AccessoryContext } from "../interfaces/accessory-context";
import { TexecomConnectPlatform } from "../texecom-connect-platform";

import { TexecomZoneAccessory } from "./texecom-zone-accessory";

/**
 * Contact Sensor Accessory
 */
export class ContactSensorAccessory
	extends TexecomZoneAccessory {

	public constructor(
		platform: TexecomConnectPlatform,
		accessory: PlatformAccessory<AccessoryContext<ConfigZone>>,
	) {
		super(
			platform,
			accessory,
			platform.service.ContactSensor,
			platform.characteristic.ContactSensorState,
			platform.characteristic.ContactSensorState.CONTACT_DETECTED);
	}

	protected listener(
		value: CharacteristicValue,
	): void {
		this.characteristic.updateValue(
			value === true
				? this.platform.characteristic.ContactSensorState.CONTACT_NOT_DETECTED
				: this.platform.characteristic.ContactSensorState.CONTACT_DETECTED,
		);

		this.platform.log.debug(
			"%s : Contact Sensor State : %s",
			this.config.name,
			value === true
				? "Open"
				: "Closed");
	}

}
