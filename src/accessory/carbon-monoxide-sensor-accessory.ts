import { CharacteristicValue, PlatformAccessory } from "homebridge";

import { ConfigZone } from "../config/config-zone";
import { AccessoryContext } from "../interfaces/accessory-context";
import { TexecomConnectPlatform } from "../texecom-connect-platform";

import { TexecomZoneAccessory } from "./texecom-zone-accessory";

/**
 * Carbon Monoxide Sensor Accessory
 */
export class CarbonMonoxideSensorAccessory
	extends TexecomZoneAccessory {

	public constructor(
		platform: TexecomConnectPlatform,
		accessory: PlatformAccessory<AccessoryContext<ConfigZone>>,
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
			this.config.name,
			value === true
				? "Yes"
				: "No");
	}

}
