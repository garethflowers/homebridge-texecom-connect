import { CharacteristicValue, PlatformAccessory } from "homebridge";

import { ConfigArea } from "../config/config-area";
import { AccessoryContext } from "../interfaces/accessory-context";
import { Messages } from "../interfaces/messages";
import { Request } from "../interfaces/requests";
import { TexecomConnectPlatform } from "../texecom-connect-platform";

import { TexecomAreaAccessory } from "./texecom-area-accessory";

/**
 * Security System Accessory
 */
export class SecuritySystemAccessory
	extends TexecomAreaAccessory {

	public constructor(
		platform: TexecomConnectPlatform,
		accessory: PlatformAccessory<AccessoryContext<ConfigArea>>,
	) {
		super(
			platform,
			accessory,
			platform.service.SecuritySystem,
			platform.characteristic.SecuritySystemCurrentState,
			platform.characteristic.SecuritySystemCurrentState.DISARMED);

		// Status - Armed
		this.platform.accessoryEvent.addListener(
			Messages.systemArmed,
			this.statusAlarmed.bind(this));

		// Status - Disarmed
		this.platform.accessoryEvent.addListener(
			Messages.systemDisarmed,
			this.statusDisarmed.bind(this));

		// Event - Arming
		this.platform.accessoryEvent.addListener(
			this.platform.getAccessoryId(this.config, Messages.armingUpdate),
			this.listenerArming.bind(this));

		// Event - Armed
		this.platform.accessoryEvent.addListener(
			this.platform.getAccessoryId(this.config, Messages.armUpdate),
			this.listenerArmed.bind(this));

		// Event - Triggered
		this.platform.accessoryEvent.addListener(
			Messages.intruderUpdate,
			this.listenerTriggered.bind(this));
	}

	protected getCharacteristic(): CharacteristicValue {
		if (this.platform.connection?.writable === true) {
			this.platform.connection.write(Request.alarmStatus);
		}

		return super.getCharacteristic();
	}

	protected listener(): void {
		// D00?,1
		// N
		this.statusDisarmed();
	}

	protected listenerArmed(
		value: number,
	): void {
		// A00?,0
		this.setServiceState(value > 1
			? this.platform.characteristic.SecuritySystemCurrentState.STAY_ARM
			: this.platform.characteristic.SecuritySystemCurrentState.AWAY_ARM);
	}

	protected listenerArming(): void {
		// X00?,0
		this.statusDisarmed();
	}

	protected listenerTriggered(): void {
		// L00?,0
		this.setServiceState(this.platform.characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED);
	}

	protected statusAlarmed(): void {
		// Y
		if (this.characteristic.value !== this.platform.characteristic.SecuritySystemCurrentState.DISARMED) {
			return;
		}

		this.setServiceState(this.platform.characteristic.SecuritySystemCurrentState.AWAY_ARM);
	}

	protected statusDisarmed(): void {
		// N
		this.setServiceState(this.platform.characteristic.SecuritySystemCurrentState.DISARMED);
	}

	private setServiceState(
		current: CharacteristicValue,
	): void {
		this.characteristic.setValue(current);
	}

}
