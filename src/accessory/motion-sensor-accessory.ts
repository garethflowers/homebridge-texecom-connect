import { CharacteristicValue, PlatformAccessory } from "homebridge";
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
			false);
	}

	protected listener(
		value: CharacteristicValue,
	): void {
		this.characteristic.updateValue(Boolean(value));

		this.platform.log.debug(
			"%s : Motion Detected : %s",
			this.accessory.context.config.name,
			value === true
				? "Yes"
				: "No");
	}

}
