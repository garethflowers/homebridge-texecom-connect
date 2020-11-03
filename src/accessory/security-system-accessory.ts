import { Callback, CharacteristicValue, PlatformAccessory } from "homebridge";
import { ConfigArea } from "../config/config-area";
import { TexecomConnectPlatform } from "../texecom-connect-platform";
import { TexecomAccessory } from "./texecom-accessory";

/**
 * Security System Accessory
 */
export class SecuritySystemAccessory
	extends TexecomAccessory {

	protected targetState: CharacteristicValue;

	public constructor(
		platform: TexecomConnectPlatform,
		accessory: PlatformAccessory<Record<string, ConfigArea>>,
	) {
		super(
			platform,
			accessory,
			platform.service.SecuritySystem,
			platform.characteristic.SecuritySystemCurrentState,
			platform.characteristic.SecuritySystemCurrentState.DISARMED);

		this.targetState = platform.characteristic.SecuritySystemTargetState.DISARM;

		// Arming
		this.platform.accessoryEvent.addListener(
			this.platform.getAccessoryId(this.accessory.context.config, "X"),
			this.listenerArming.bind(this));

		// Armed
		this.platform.accessoryEvent.addListener(
			"Y",
			this.statusActive.bind(this));
		this.platform.accessoryEvent.addListener(
			this.platform.getAccessoryId(this.accessory.context.config, "A"),
			this.listenerArmed.bind(this));

		// Disarmed
		this.platform.accessoryEvent.addListener(
			"N",
			this.listener.bind(this));

		// Disarmed
		this.platform.accessoryEvent.addListener(
			"L",
			this.listenerTriggered.bind(this));
	}

	protected getCharacteristic(
		callback: Callback,
	): void {
		if (this.platform.connection?.writable === true) {
			this.platform.connection.write("ASTATUS");
		}

		super.getCharacteristic(callback);
	}

	protected listener(): void {
		// A00?,1
		this.setServiceState(
			this.platform.characteristic.SecuritySystemCurrentState.DISARMED,
			this.platform.characteristic.SecuritySystemTargetState.DISARM,
		);
	}

	protected listenerArmed(
		value: number,
	): void {
		// A00?,0
		this.setServiceState(
			value > 1
				? this.platform.characteristic.SecuritySystemCurrentState.STAY_ARM
				: this.platform.characteristic.SecuritySystemCurrentState.AWAY_ARM,
			value > 1
				? this.platform.characteristic.SecuritySystemTargetState.STAY_ARM
				: this.platform.characteristic.SecuritySystemTargetState.AWAY_ARM,
		);
	}

	protected listenerArming(): void {
		// X00?,0
		this.setServiceState(
			this.platform.characteristic.SecuritySystemCurrentState.DISARMED,
			this.platform.characteristic.SecuritySystemTargetState.AWAY_ARM,
		);
	}

	protected listenerTriggered(): void {
		// L00?,0
		this.setServiceState(
			this.platform.characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED,
		);
	}

	protected statusActive(): void {
		// A00?,1
		this.setServiceState(
			this.platform.characteristic.SecuritySystemCurrentState.DISARMED,
			this.platform.characteristic.SecuritySystemTargetState.DISARM,
		);
	}

	private setServiceState(
		current: CharacteristicValue,
		target?: CharacteristicValue,
	): void {
		this.state = current;
		this.targetState = target ?? this.targetState;

		this.characteristic.setValue(this.state);

		this.service
			.getCharacteristic(this.platform.characteristic.SecuritySystemTargetState)
			.setValue(this.targetState);
	}

}
