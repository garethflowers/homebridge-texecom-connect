import { CharacteristicValue, PlatformAccessory } from "homebridge";
import { ConfigZone } from "../config/config-zone";
import { AccessoryContext } from "../interfaces/accessory-context";
import { TexecomConnectPlatform } from "../texecom-connect-platform";
import { TexecomZoneAccessory } from "./texecom-zone-accessory";

/**
 * Motion Sensor Accessory
 */
export class MotionSensorAccessory
	extends TexecomZoneAccessory {

	public constructor(
		platform: TexecomConnectPlatform,
		accessory: PlatformAccessory<AccessoryContext<ConfigZone>>,
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
			this.config.name,
			value === true
				? "Yes"
				: "No");
	}

}
