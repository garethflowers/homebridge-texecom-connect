import { EventEmitter } from "events";
import {
	API,
	Characteristic,
	DynamicPlatformPlugin,
	Logger,
	PlatformAccessory,
	PlatformConfig,
	Service,
} from "homebridge";
import * as net from "net";
import { CarbonMonoxideSensorAccessory } from "./accessory/carbon-monoxide-sensor-accessory";
import { ContactSensorAccessory } from "./accessory/contact-sensor-accessory";
import { MotionSensorAccessory } from "./accessory/motion-sensor-accessory";
import { SecuritySystemAccessory } from "./accessory/security-system-accessory";
import { SmokeSensorAccessory } from "./accessory/smoke-sensor-accessory";
import { Config } from "./config/config";
import { ConfigAccessory } from "./config/config-accessory";
import { ConfigArea } from "./config/config-area";
import { ConfigZone } from "./config/config-zone";
import { platformName, pluginName } from "./settings";

/**
 * Texecom Connect Platform.
 */
export class TexecomConnectPlatform implements DynamicPlatformPlugin {

	public readonly accessories: PlatformAccessory<Record<string, ConfigAccessory>>[] ;

	public readonly accessoryEvent: EventEmitter;

	public readonly api: API;

	public readonly characteristic: typeof Characteristic;

	public readonly config: PlatformConfig;

	public connection?: net.Socket;

	public readonly log: Logger;

	public readonly service: typeof Service;

	private readonly configAccessories: (ConfigArea | ConfigZone)[];

	public constructor(
		log: Logger,
		config: PlatformConfig,
		api: API,
	) {
		this.api = api;
		this.config = config;
		this.log = log;

		this.accessories = [];
		this.accessoryEvent = new EventEmitter();
		this.characteristic = this.api.hap.Characteristic;
		this.service = this.api.hap.Service;

		this.configAccessories = [
			...(this.config as Config).areas ?? [],
			...(this.config as Config).zones ?? [],
		]
			.filter((accessory: Partial<ConfigArea | ConfigZone>) =>
				typeof accessory.name === "string"
				&& accessory.name.length > 1
				&& typeof accessory.number === "number"
				&& accessory.number > 0);

		this.sanitiseConfig();

		this.api
			.on("didFinishLaunching", this.onStartUp.bind(this))
			.on("shutdown", this.onShutdown.bind(this));
	}

	/**
	 * Configure Accessory after Platform Init
	 */
	public configureAccessory(
		accessory: PlatformAccessory<Record<string, ConfigAccessory>>,
	): void {
		this.accessories.push(accessory);
	}

	public getAccessoryId(
		configAccessory: ConfigAccessory,
		prefix?: "D" | "Z" | string,
	): string {
		const accessoryLength: number = 3;
		const idNumber: string = Number(configAccessory.number)
			.toFixed()
			.padStart(accessoryLength, "0");

		const idPrefix: "D" | "Z" | string = prefix
			?? (configAccessory.accessory === "security"
				? "D"
				: "Z");

		return idPrefix + idNumber;
	}

	/**
	 * Deprecate old Accessories which are invalid.
	 */
	private deprecateAccessories(): void {
		this.accessories
			.filter((accessory) => {
				return !this.configAccessories.some((configAccessory: ConfigArea | ConfigZone) =>
					configAccessory.accessory === accessory.context.config.accessory
					&& configAccessory.name === accessory.context.config.name
					&& configAccessory.number === accessory.context.config.number
					&& accessory.UUID === this.api.hap.uuid.generate(this.getAccessoryId(configAccessory)));
			})
			.forEach((accessory) => {
				this.api.unregisterPlatformAccessories(pluginName, platformName, [accessory]);
			});
	}

	/**
	 * Discover new Accessories.
	 */
	private discoverDevices(): void {
		this.configAccessories
			.forEach((configAccessory: ConfigArea | ConfigZone) => {
				const uuid: string = this.api.hap.uuid.generate(this.getAccessoryId(configAccessory));

				let accessory: PlatformAccessory<Record<string, ConfigAccessory>> | undefined =
					this.accessories.find((acc: PlatformAccessory<Record<string, ConfigAccessory>>) =>
						acc.UUID === uuid);

				if (accessory === undefined) {
					accessory = new this.api.platformAccessory(configAccessory.name, uuid);
					this.accessories.push(accessory);
					this.api.registerPlatformAccessories(pluginName, platformName, [accessory]);
				}

				this.initAccessory(accessory, configAccessory);
				this.api.updatePlatformAccessories([accessory]);
			});
	}

	private initAccessory(
		accessory: PlatformAccessory,
		config: ConfigArea | ConfigZone,
	): void {
		accessory.displayName = config.name;
		accessory.context.config = config;

		switch (config.accessory) {
			case "contact":
				new ContactSensorAccessory(this, accessory);
				break;
			case "smoke":
				new SmokeSensorAccessory(this, accessory);
				break;
			case "carbon-monoxide":
				new CarbonMonoxideSensorAccessory(this, accessory);
				break;
			case "security":
				new SecuritySystemAccessory(this, accessory);
				break;
			default:
				new MotionSensorAccessory(this, accessory);
		}

		this.log.info("Accessory Loaded:", accessory.displayName);
	}

	/**
	 * Shutdown
	 */
	private onShutdown(): void {
		this.socketShutdown();
	}

	/**
	 * Start Up
	 */
	private onStartUp(): void {
		this.deprecateAccessories();
		this.discoverDevices();
		this.socketStartUp();
	}

	private parseData(
		data: string,
	): void {
		const dataString: string = data
			.toString()
			.trim()
			.split("\n")
			.pop()
			?? "";

		this.log.debug("Socket Data:", dataString);

		if (!dataString.startsWith("\"")) {
			this.socketRestart();

			return;
		}

		const statePosition: number = 5;
		const state: number | string = Number(dataString.substring(statePosition));
		let event: string = dataString.substring(1, statePosition);
		event = event.startsWith("Y") || event.startsWith("N")
			? event.substring(0, 1)
			: event;

		this.accessoryEvent.emit(event, state);
	}

	private sanitiseConfig(): void {
		const maxPort: number = 65535;
		const defaultPort: number = 10001;

		this.config.port = typeof this.config.port === "number"
			&& this.config.port >= 1
			&& this.config.port <= maxPort
			? Math.floor(this.config.port)
			: defaultPort;

		this.config.host = typeof this.config.host === "string"
			? this.config.host.trim()
			: "127.0.0.1";
	}

	/**
	 * Restarts the socket connection to SmartCom.
	 */
	private socketRestart(): void {
		this.log.info("Reconnecting to SmartCom - %s:%s", this.config.host, this.config.port);

		this.socketShutdown();

		const reconnectTimeout: number = 10000;

		// eslint-disable-next-line no-restricted-globals
		setTimeout(
			this.socketStartUp.bind(this),
			reconnectTimeout);
	}

	/**
	 * Shutdown the socket connection to SmartCom.
	 */
	private socketShutdown(): void {
		if (this.connection?.destroyed === false) {
			this.connection.destroy();
		}
	}

	/**
	 * Start the socket connection to SmartCom.
	 */
	private socketStartUp(): void {
		this.connection = net
			.createConnection(this.config.port as number, this.config.host as string)
			.on("connect", () => {
				this.log.info("Connected to SmartCom - %s:%s", this.config.host, this.config.port);
			})
			.on("error", (error: Error) => {
				if ((error as unknown as { code: string }).code === "ECONNREFUSED") {
					this.log.error("Unable to connect to %s:%s", this.config.host, this.config.port);
				} else {
					this.log.debug("Socket Error:", error);
				}
			})
			.on("close", (hadError: boolean) => {
				if (hadError) {
					this.socketRestart();
				} else {
					this.log.info("Disconnected from SmartCom - %s:%s", this.config.host, this.config.port);
				}
			})
			.on("data", this.parseData.bind(this));
	}

}
