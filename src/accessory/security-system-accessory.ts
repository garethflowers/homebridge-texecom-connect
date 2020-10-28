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
			platform.Service.SecuritySystem,
			platform.Characteristic.SecuritySystemCurrentState,
			platform.Characteristic.SecuritySystemCurrentState.DISARMED);

		this.targetState = platform.Characteristic.SecuritySystemTargetState.DISARM;

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

	protected listenerTriggered(): void {
		// L00?,0
		this.setServiceState(
			this.platform.Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED,
		);
	}

	protected listenerArmed(
		value: number,
	): void {
		// A00?,0
		this.setServiceState(
			value > 1
				? this.platform.Characteristic.SecuritySystemCurrentState.STAY_ARM
				: this.platform.Characteristic.SecuritySystemCurrentState.AWAY_ARM,
			value > 1
				? this.platform.Characteristic.SecuritySystemTargetState.STAY_ARM
				: this.platform.Characteristic.SecuritySystemTargetState.AWAY_ARM,
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
			.getCharacteristic(this.platform.Characteristic.SecuritySystemTargetState)
			.setValue(this.targetState);
	}

	protected statusActive(): void {
		// A00?,1
		this.setServiceState(
			this.platform.Characteristic.SecuritySystemCurrentState.DISARMED,
			this.platform.Characteristic.SecuritySystemTargetState.DISARM,
		);
	}

	protected getCharacteristic(
		callback: Callback,
	): void {
		if (this.platform.connection?.writable) {
			this.platform.connection.write("ASTATUS");
		}

		super.getCharacteristic(callback);
	}

}
