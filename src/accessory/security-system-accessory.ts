import { PlatformAccessory } from "homebridge";
import { ConfigArea } from "../config/config-area";
import { TexecomConnectPlatform } from "../texecom-connect-platform";
import { TexecomAccessory } from "./texecom-accessory";

/**
 * Security System Accessory
 */
export class SecuritySystemAccessory
	extends TexecomAccessory {

	public constructor(
		platform: TexecomConnectPlatform,
		accessory: PlatformAccessory<Record<string, ConfigArea>>,
	) {
		super(
			platform,
			accessory,
			platform.Service.SecuritySystem);

		/* this.platform.accessoryEvent.addListener(
			this.platform.getAccessoryId(this.accessory.context.config),
			this.listener.bind(this));

		this.platform.accessoryEvent.addListener(
			this.platform.getAccessoryId(this.accessory.context.config),
			this.listener.bind(this)); */

		this.service
			.getCharacteristic(this.platform.Characteristic.SecuritySystemCurrentState)
			.setValue(this.platform.Characteristic.SecuritySystemCurrentState.DISARMED);
		this.service
			.getCharacteristic(this.platform.Characteristic.SecuritySystemTargetState)
			.setValue(this.platform.Characteristic.SecuritySystemTargetState.DISARM);
	}

	protected listener(
		value: number,
	): void {
		this.service
			.getCharacteristic(this.platform.Characteristic.SecuritySystemCurrentState)
			.setValue(value === this.platform.Characteristic.SecuritySystemCurrentState.DISARMED
				? this.platform.Characteristic.SecuritySystemCurrentState.DISARMED
				: this.platform.Characteristic.SecuritySystemCurrentState.DISARMED);
	}

}
