import { PlatformAccessory } from "homebridge";
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
		value: number,
	): void {
		this.characteristic.setValue(
			value === this.platform.characteristic.ContactSensorState.CONTACT_NOT_DETECTED
				? this.platform.characteristic.ContactSensorState.CONTACT_NOT_DETECTED
				: this.platform.characteristic.ContactSensorState.CONTACT_DETECTED,
		);

		this.platform.log.debug(
			"Motion Sensor : %s : %s",
			this.accessory.context.config.name,
			this.state === this.platform.characteristic.ContactSensorState.CONTACT_NOT_DETECTED
				? "Open"
				: "Closed");
	}

}
