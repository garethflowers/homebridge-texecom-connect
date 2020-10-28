import { Callback, Characteristic, CharacteristicValue, PlatformAccessory, Service, WithUUID } from "homebridge";
import { ConfigAccessory } from "../config/config-accessory";
import { TexecomConnectPlatform } from "../texecom-connect-platform";

/**
 * Texecom Accessory
 */
export abstract class TexecomAccessory {

	protected readonly service: Service;

	protected get characteristic(): Characteristic {
		return this.service.getCharacteristic(this.serviceCharacteristic);
	}

	public constructor(
		protected readonly platform: TexecomConnectPlatform,
		protected readonly accessory: PlatformAccessory<Record<string, ConfigAccessory>>,
		protected readonly serviceType: WithUUID<typeof Service>,
		protected readonly serviceCharacteristic: WithUUID<{ new(): Characteristic }>,

		protected state: CharacteristicValue,
	) {
		this.accessory
			.getService(this.platform.Service.AccessoryInformation)
			?.setCharacteristic(this.platform.Characteristic.Manufacturer, "Texecom")
			?.setCharacteristic(this.platform.Characteristic.Model, "Texecom Accessory")
			?.setCharacteristic(this.platform.Characteristic.SerialNumber, "Unknown");

		this.service =
			this.accessory.getService(this.serviceType)
			?? this.accessory.addService(this.serviceType);

		this.service.setCharacteristic(
			this.platform.Characteristic.Name,
			this.accessory.context.config.name);

		this.platform.accessoryEvent
			.addListener(
				this.platform.getAccessoryId(this.accessory.context.config),
				this.listener.bind(this));

		this.characteristic
			.on("get", this.getCharacteristic.bind(this))
			.on("set", this.setCharacteristic.bind(this));
	}

	protected abstract listener(
		value: number,
	): void;

	protected getCharacteristic(
		callback: Callback,
	): void {
		callback(null, this.state);
	}

	protected setCharacteristic(
		value: CharacteristicValue,
		callback: Callback,
	): void {
		this.state = value;
		callback(null);
	}

}
