import { CharacteristicValue, PlatformAccessory } from "homebridge";
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
			platform.Service.SecuritySystem,
			platform.Characteristic.SecuritySystemCurrentState,
			platform.Characteristic.SecuritySystemCurrentState.DISARMED);

		// Arming
		this.platform.accessoryEvent.addListener(
			this.platform.getAccessoryId(this.accessory.context.config, "X"),
			this.listenerArming.bind(this));

		// Armed
		this.platform.accessoryEvent.addListener(
			"Y",
			this.listenerArmed.bind(this));
		this.platform.accessoryEvent.addListener(
			this.platform.getAccessoryId(this.accessory.context.config, "A"),
			this.listenerArmed.bind(this));

		// Disarmed
		this.platform.accessoryEvent.addListener(
			"N",
			this.listener.bind(this));

		this.checkCurrentStates();
	}

	private checkCurrentStates(): void {
		if (this.platform.connection?.writable) {
			this.platform.connection.write("ASTATUS");
		}

		setInterval(
			this.checkCurrentStates.bind(this),
			60000);
	}

	protected listener(): void {
		// A00?,1
		this.setServiceState(
			this.platform.Characteristic.SecuritySystemCurrentState.DISARMED,
			this.platform.Characteristic.SecuritySystemTargetState.DISARM,
		);
	}

	protected listenerArming(): void {
		// X00?,0
		this.setServiceState(
			this.platform.Characteristic.SecuritySystemCurrentState.DISARMED,
			this.platform.Characteristic.SecuritySystemTargetState.AWAY_ARM,
		);
	}

	protected listenerArmed(): void {
		// A00?,0
		this.setServiceState(
			this.platform.Characteristic.SecuritySystemCurrentState.AWAY_ARM,
			this.platform.Characteristic.SecuritySystemTargetState.AWAY_ARM,
		);
	}

	private setServiceState(
		current: CharacteristicValue,
		target: CharacteristicValue,
	): void {
		this.characteristic
			.setValue(current);
		this.service
			.getCharacteristic(this.platform.Characteristic.SecuritySystemTargetState)
			.setValue(target);
	}

}
