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
			platform.Service.SmokeSensor);
	}

	protected listener(
		value: number,
	): void {
		this.service
			.getCharacteristic(this.platform.Characteristic.CarbonMonoxideDetected)
			.setValue(value === this.platform.Characteristic.CarbonMonoxideDetected.CO_LEVELS_ABNORMAL
				? this.platform.Characteristic.CarbonMonoxideDetected.CO_LEVELS_ABNORMAL
				: this.platform.Characteristic.CarbonMonoxideDetected.CO_LEVELS_NORMAL);
	}

}
