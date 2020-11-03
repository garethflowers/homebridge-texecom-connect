import { PlatformAccessory } from "homebridge";
import { ConfigZone } from "../config/config-zone";
import { TexecomConnectPlatform } from "../texecom-connect-platform";
import { TexecomAccessory } from "./texecom-accessory";

/**
 * Motion Sensor Accessory
 */
export class MotionSensorAccessory
	extends TexecomAccessory {

	public constructor(
		platform: TexecomConnectPlatform,
		accessory: PlatformAccessory<Record<string, ConfigZone>>,
	) {
		super(
			platform,
			accessory,
			platform.service.MotionSensor,
			platform.characteristic.MotionDetected,
			platform.characteristic.ContactSensorState.CONTACT_DETECTED);
	}

	protected listener(
		value: number,
	): void {
		this.characteristic.setValue(
			value === this.platform.characteristic.ContactSensorState.CONTACT_DETECTED
				? this.platform.characteristic.ContactSensorState.CONTACT_DETECTED
				: this.platform.characteristic.ContactSensorState.CONTACT_NOT_DETECTED,
		);
	}

}
