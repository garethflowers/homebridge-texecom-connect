import { PlatformAccessory } from "homebridge";
import { ConfigZone } from "../config-zone";
import { TexecomConnectPlatform } from "../texecom-connect-platform";
import { TexecomAccessory } from "./texecom-accessory";

/**
 * Contact Sensor Accessory
 */
export class ContactSensorAccessory
	extends TexecomAccessory {

	public constructor(
		platform: TexecomConnectPlatform,
		accessory: PlatformAccessory,
		zone: ConfigZone,
	) {
		super(
			platform,
			accessory,
			zone,
			platform.Service.ContactSensor);
	}

	protected listener(
		value: number,
	): void {
		this.service
			.getCharacteristic(this.platform.Characteristic.ContactSensorState)
			.setValue(value === this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED
				? this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED
				: this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
	}

}
