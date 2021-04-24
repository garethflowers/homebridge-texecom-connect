import { Characteristic, CharacteristicValue, PlatformAccessory, Service, WithUUID } from "homebridge";
import { ConfigAccessory } from "../config/config-accessory";
import { TexecomConnectPlatform } from "../texecom-connect-platform";

/**
 * Texecom Accessory
 */
export abstract class TexecomAccessory {

	protected readonly accessory: PlatformAccessory<Record<string, ConfigAccessory>>;

	protected readonly platform: TexecomConnectPlatform;

	protected readonly service: Service;

	protected get characteristic(): Characteristic {
		return this.service.getCharacteristic(this.serviceCharacteristic);
	}

	protected readonly serviceCharacteristic: WithUUID<new () => Characteristic>;

	protected readonly serviceType: WithUUID<typeof Service>;

	protected state: CharacteristicValue;

	public constructor(
		platform: TexecomConnectPlatform,
		accessory: PlatformAccessory<Record<string, ConfigAccessory>>,
		serviceType: WithUUID<typeof Service>,
		serviceCharacteristic: WithUUID<new () => Characteristic>,
		state: CharacteristicValue,
	) {
		this.accessory = accessory;
		this.platform = platform;
		this.serviceCharacteristic = serviceCharacteristic;
		this.serviceType = serviceType;
		this.state = state;

		this.accessory
			.getService(this.platform.service.AccessoryInformation)
			?.setCharacteristic(this.platform.characteristic.Manufacturer, "Texecom")
			?.setCharacteristic(this.platform.characteristic.Model, "Texecom Accessory")
			?.setCharacteristic(this.platform.characteristic.SerialNumber, "Unknown");

		this.service =
			this.accessory.getService(this.serviceType)
			?? this.accessory.addService(this.serviceType);

		this.service.setCharacteristic(
			this.platform.characteristic.Name,
			this.accessory.context.config.name);

		this.platform.accessoryEvent
			.addListener(
				this.platform.getAccessoryId(this.accessory.context.config),
				this.listener.bind(this));

		this.characteristic
			.onGet(this.getCharacteristic.bind(this))
			.onSet(this.setCharacteristic.bind(this));
	}

	protected getCharacteristic(
	): CharacteristicValue {
		return this.state;
	}

	protected setCharacteristic(
		value: CharacteristicValue,
	): void {
		this.state = value;
	}

	protected abstract listener(
		value: number,
	): void;

}
