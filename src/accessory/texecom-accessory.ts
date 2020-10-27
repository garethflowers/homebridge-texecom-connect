import { PlatformAccessory, Service, WithUUID } from "homebridge";
import { ConfigZone } from "../config-zone";
import { TexecomConnectPlatform } from "../texecom-connect-platform";

/**
 * Texecom Accessory
 */
export abstract class TexecomAccessory {

	protected readonly service: Service;

	public constructor(
		protected readonly platform: TexecomConnectPlatform,
		protected readonly accessory: PlatformAccessory,
		protected readonly zone: ConfigZone,
		protected serviceType: WithUUID<typeof Service>,
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
			this.zone.name);

		this.platform.accessoryEvent.addListener(
			this.platform.getZoneId(this.zone),
			this.listener.bind(this));
	}

	protected abstract listener(
		value: number,
	): void;

}
