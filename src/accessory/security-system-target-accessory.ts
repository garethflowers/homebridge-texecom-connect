import { promisify } from "util";

import { CharacteristicValue, PlatformAccessory } from "homebridge";

import { ConfigArea } from "../config/config-area";
import { AccessoryContext } from "../interfaces/accessory-context";
import { Request } from "../interfaces/requests";
import { TexecomConnectPlatform } from "../texecom-connect-platform";

import { TexecomAreaAccessory } from "./texecom-area-accessory";

/**
 * Security System Target Accessory
 */
export class SecuritySystemTargetAccessory
	extends TexecomAreaAccessory {

	public constructor(
		platform: TexecomConnectPlatform,
		accessory: PlatformAccessory<AccessoryContext<ConfigArea>>,
	) {
		super(
			platform,
			accessory,
			platform.service.SecuritySystem,
			platform.characteristic.SecuritySystemTargetState,
			platform.characteristic.SecuritySystemTargetState.DISARM);
	}

	protected listener(): void {
		return;
	}

	protected async setCharacteristic(
		value: CharacteristicValue,
	): Promise<void> {
		if (this.config.userCode === undefined) {
			return;
		}

		super.setCharacteristic(value);

		let state: string = "Off";

		switch (value) {
			case this.platform.characteristic.SecuritySystemTargetState.STAY_ARM:
				state = "Home";
				break;
			case this.platform.characteristic.SecuritySystemTargetState.AWAY_ARM:
				state = "Away";
				break;
			case this.platform.characteristic.SecuritySystemTargetState.NIGHT_ARM:
				state = "Night";
				break;
			default:
		}

		this.platform.log.info(
			"%s : Security System Mode Changed : %s",
			this.config.name,
			state);

		await this.processKeys(this.config.userCode);
	}

	private async processKeys(
		keys: string,
	): Promise<void> {
		if (this.platform.connection?.writable !== true) {
			return;
		}

		const keyDelay: number = 500;

		for (const key of keys) {
			this.platform.connection.write(`${Request.key}${key}`);

			await promisify(global.setTimeout)(keyDelay);
		}

		this.platform.connection.write(Request.panelStatus);
	}

}
