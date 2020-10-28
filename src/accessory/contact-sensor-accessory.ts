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
			platform.Service.ContactSensor,
			platform.Characteristic.ContactSensorState,
			platform.Characteristic.ContactSensorState.CONTACT_DETECTED);
	}

	protected listener(
		value: number,
	): void {
		this.characteristic.setValue(
			value === this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED
				? this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED
				: this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED,
		);
	}

}
