import { Characteristic, CharacteristicValue, PlatformAccessory, Service, WithUUID } from "homebridge";

import { ConfigAccessory } from "../config/config-accessory";
import { AccessoryContext } from "../interfaces/accessory-context";
import { TexecomConnectPlatform } from "../texecom-connect-platform";

/**
 * Texecom Accessory
 */
export abstract class TexecomAccessory<T extends ConfigAccessory> {

	protected readonly accessory: PlatformAccessory<AccessoryContext<T>>;

	protected readonly config: T;

	protected readonly platform: TexecomConnectPlatform;

	protected readonly service: Service;

	protected readonly serviceCharacteristic: WithUUID<new () => Characteristic>;

	protected readonly serviceType: WithUUID<typeof Service>;

	protected state: CharacteristicValue;

	protected get characteristic(): Characteristic {
		return this.service.getCharacteristic(this.serviceCharacteristic);
	}

	public constructor(
		platform: TexecomConnectPlatform,
		accessory: PlatformAccessory<AccessoryContext<T>>,
		serviceType: WithUUID<typeof Service>,
		serviceCharacteristic: WithUUID<new () => Characteristic>,
		state: CharacteristicValue,
	) {
		this.accessory = accessory;
		this.config = this.accessory.context.config;
		this.platform = platform;
		this.serviceCharacteristic = serviceCharacteristic;
		this.serviceType = serviceType;
		this.state = state;

		const serviceInformation: Service | undefined = this.accessory
			.getService(this.platform.service.AccessoryInformation);

		if (serviceInformation !== undefined) {
			serviceInformation.setCharacteristic(this.platform.characteristic.Manufacturer, "Texecom")
				.setCharacteristic(this.platform.characteristic.Model, "Texecom Accessory")
				.setCharacteristic(this.platform.characteristic.SerialNumber, "Unknown");
		}

		this.service =
			this.accessory.getService(this.serviceType)
			?? this.accessory.addService(this.serviceType as unknown as Service); // Type hack

		this.service.setCharacteristic(
			this.platform.characteristic.Name,
			this.config.name);

		this.platform.accessoryEvent
			.on(
				this.platform.getAccessoryId(this.config),
				this.listener.bind(this));

		this.characteristic
			.onGet(this.getCharacteristic.bind(this))
			.onSet(this.setCharacteristic.bind(this));
	}

	protected getCharacteristic(): CharacteristicValue {
		return this.state;
	}

	protected setCharacteristic(
		value: CharacteristicValue,
	): void {
		this.state = value;
	}

	protected abstract listener(
		value: CharacteristicValue,
	): void;

}
