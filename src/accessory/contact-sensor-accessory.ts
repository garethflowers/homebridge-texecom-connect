import { CharacteristicValue, PlatformAccessory } from "homebridge";
import { ConfigZone } from "../config/config-zone";
import { TexecomConnectPlatform } from "../texecom-connect-platform";
import { TexecomAccessory } from "./texecom-accessory";

/**
 * Contact Sensor Accessory
 */
export class ContactSensorAccessory
	extends TexecomAccessory {

	public constructor(
		platform: TexecomConnectPlatform,
		accessory: PlatformAccessory<Record<string, ConfigZone>>,
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
			this.accessory.context.config.name,
			value === true
				? "Open"
				: "Closed");
	}

}
