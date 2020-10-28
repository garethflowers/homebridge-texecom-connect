import { PlatformAccessory } from "homebridge";
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
			platform.Service.SmokeSensor,
			platform.Characteristic.SmokeDetected,
			platform.Characteristic.SmokeDetected.SMOKE_NOT_DETECTED,
		);
	}

	protected listener(
		value: number,
	): void {
		this.characteristic.setValue(
			value === this.platform.Characteristic.SmokeDetected.SMOKE_DETECTED
				? this.platform.Characteristic.SmokeDetected.SMOKE_DETECTED
				: this.platform.Characteristic.SmokeDetected.SMOKE_NOT_DETECTED,
		);
	}

}
