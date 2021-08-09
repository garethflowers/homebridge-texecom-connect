import { CharacteristicValue, PlatformAccessory } from "homebridge";
import { ConfigZone } from "../config/config-zone";
import { TexecomConnectPlatform } from "../texecom-connect-platform";
import { TexecomAccessory } from "./texecom-accessory";

/**
 * Smoke Sensor Accessory
 */
export class SmokeSensorAccessory
	extends TexecomAccessory {

	public constructor(
		platform: TexecomConnectPlatform,
		accessory: PlatformAccessory<Record<string, ConfigZone>>,
	) {
		super(
			platform,
			accessory,
			platform.service.SmokeSensor,
			platform.characteristic.SmokeDetected,
			platform.characteristic.SmokeDetected.SMOKE_NOT_DETECTED,
		);
	}

	protected listener(
		value: CharacteristicValue,
	): void {
		this.characteristic.updateValue(
			value === true
				? this.platform.characteristic.SmokeDetected.SMOKE_DETECTED
				: this.platform.characteristic.SmokeDetected.SMOKE_NOT_DETECTED,
		);

		this.platform.log.debug(
			"%s : Smoke Detected : %s",
			this.accessory.context.config.name,
			value === true
				? "Yes"
				: "No");
	}

}
