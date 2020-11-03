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
			platform.service.SmokeSensor,
			platform.characteristic.SmokeDetected,
			platform.characteristic.SmokeDetected.SMOKE_NOT_DETECTED,
		);
	}

	protected listener(
		value: number,
	): void {
		this.characteristic.setValue(
			value === this.platform.characteristic.SmokeDetected.SMOKE_DETECTED
				? this.platform.characteristic.SmokeDetected.SMOKE_DETECTED
				: this.platform.characteristic.SmokeDetected.SMOKE_NOT_DETECTED,
		);
	}

}
