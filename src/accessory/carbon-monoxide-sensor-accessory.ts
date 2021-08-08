import { CharacteristicValue, PlatformAccessory } from "homebridge";
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
			platform.service.SmokeSensor,
			platform.characteristic.CarbonMonoxideDetected,
			platform.characteristic.CarbonMonoxideDetected.CO_LEVELS_NORMAL);
	}

	protected listener(
		value: CharacteristicValue,
	): void {
		this.characteristic.updateValue(
			value === true
				? this.platform.characteristic.CarbonMonoxideDetected.CO_LEVELS_ABNORMAL
				: this.platform.characteristic.CarbonMonoxideDetected.CO_LEVELS_NORMAL,
		);

		this.platform.log.debug(
			"%s : Carbon Monoxide Detected : %s",
			this.accessory.context.config.name,
			value === true
				? "Yes"
				: "No");
	}

}
