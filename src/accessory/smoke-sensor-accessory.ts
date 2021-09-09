import { CharacteristicValue, PlatformAccessory } from "homebridge";
import { ConfigZone } from "../config/config-zone";
import { AccessoryContext } from "../interfaces/accessory-context";
import { TexecomConnectPlatform } from "../texecom-connect-platform";
import { TexecomZoneAccessory } from "./texecom-zone-accessory";

/**
 * Smoke Sensor Accessory
 */
export class SmokeSensorAccessory
	extends TexecomZoneAccessory {

	public constructor(
		platform: TexecomConnectPlatform,
		accessory: PlatformAccessory<AccessoryContext<ConfigZone>>,
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
			this.config.name,
			value === true
				? "Yes"
				: "No");
	}

}
