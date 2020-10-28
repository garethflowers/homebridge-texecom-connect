import { PlatformAccessory } from "homebridge";
import { ConfigZone } from "../config/config-zone";
import { TexecomConnectPlatform } from "../texecom-connect-platform";
import { TexecomAccessory } from "./texecom-accessory";

/**
 * Carbon Monoxide Sensor Accessory
 */
export class CarbonMonoxideSensorAccessory
	extends TexecomAccessory {

	public constructor(
		platform: TexecomConnectPlatform,
		accessory: PlatformAccessory<Record<string, ConfigZone>>,
	) {
		super(
			platform,
			accessory,
			platform.Service.SmokeSensor,
			platform.Characteristic.CarbonMonoxideDetected,
			platform.Characteristic.CarbonMonoxideDetected.CO_LEVELS_NORMAL);
	}

	protected listener(
		value: number,
	): void {
		this.characteristic.setValue(
			value === this.platform.Characteristic.CarbonMonoxideDetected.CO_LEVELS_ABNORMAL
				? this.platform.Characteristic.CarbonMonoxideDetected.CO_LEVELS_ABNORMAL
				: this.platform.Characteristic.CarbonMonoxideDetected.CO_LEVELS_NORMAL,
		);
	}

}
