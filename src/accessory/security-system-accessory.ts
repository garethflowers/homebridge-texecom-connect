import { CharacteristicValue, PlatformAccessory } from "homebridge";
import { ConfigArea } from "../config/config-area";
import { Messages } from "../interfaces/messages";
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
			this.platform.getAccessoryId(this.accessory.context.config, Messages.armingUpdate),
			this.listenerArming.bind(this));

		// Event - Armed
		this.platform.accessoryEvent.addListener(
			this.platform.getAccessoryId(this.accessory.context.config, Messages.armUpdate),
			this.listenerArmed.bind(this));

		// Event - Disarmed
		this.platform.accessoryEvent.addListener(
			Messages.intruderUpdate,
			this.listenerTriggered.bind(this));

		this.service
			.getCharacteristic(platform.characteristic.SecuritySystemTargetState)
			.onSet((value: CharacteristicValue) => {
				this.targetState = value;
			})
			.onGet(() => {
				return this.targetState;
			});
	}

	protected getCharacteristic(): CharacteristicValue {
		if (this.platform.connection?.writable === true) {
			this.platform.connection.write("ASTATUS");
		}

		return super.getCharacteristic();
	}

	protected listener(): void {
		// D00?,1
		// N
		this.setServiceState(this.platform.characteristic.SecuritySystemCurrentState.DISARMED);
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
		this.setServiceState(this.platform.characteristic.SecuritySystemCurrentState.DISARMED);
	}

	protected listenerTriggered(): void {
		// L00?,0
		this.setServiceState(this.platform.characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED);
	}

	protected statusAlarmed(): void {
		// Y
		if (this.state !== this.platform.characteristic.SecuritySystemCurrentState.DISARMED) {
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
		this.state = current;
		this.characteristic.setValue(current);
	}

}
