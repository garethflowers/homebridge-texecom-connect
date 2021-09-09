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
import { SecuritySystemAccessory } from "./accessory/security-system-current-accessory";
import { SecuritySystemTargetAccessory } from "./accessory/security-system-target-accessory";
import { SmokeSensorAccessory } from "./accessory/smoke-sensor-accessory";
import { Config } from "./config/config";
import { ConfigAccessory } from "./config/config-accessory";
import { ConfigArea } from "./config/config-area";
import { ConfigZone } from "./config/config-zone";
import { AccessoryContext } from "./interfaces/accessory-context";
import { Message } from "./interfaces/message";
import { MessageAlarmEvent } from "./interfaces/message-alarm-event";
import { MessageStatusEvent } from "./interfaces/message-status-event";
import { Messages } from "./interfaces/messages";
import { platformName, pluginName } from "./settings";

/**
 * Texecom Connect Platform.
 */
export class TexecomConnectPlatform implements DynamicPlatformPlugin {

	public readonly accessories: PlatformAccessory<AccessoryContext>[];

	public readonly accessoryEvent: EventEmitter;

	public readonly api: API;

	public readonly characteristic: typeof Characteristic;

	public readonly config: Config;

	public readonly configAccessories: ConfigAccessory[];

	public connection?: net.Socket;

	public readonly log: Logger;

	public readonly service: typeof Service;

	private lastSocketResponse: number;

	public constructor(
		log: Logger,
		config: PlatformConfig,
		api: API,
	) {
		this.api = api;
		this.config = config as Config;
		this.log = log;

		this.accessories = [];
		this.accessoryEvent = new EventEmitter();
		this.characteristic = this.api.hap.Characteristic;
		this.service = this.api.hap.Service;
		this.lastSocketResponse = 0;

		this.sanitiseConfig();

		this.configAccessories = [...this.config.areas, ...this.config.zones]
			.filter((accessory: Partial<ConfigAccessory>) =>
				typeof accessory.name === "string"
				&& accessory.name.length > 1
				&& typeof accessory.number === "number"
				&& accessory.number > 0);

		this.api
			.on("didFinishLaunching", this.onStartUp.bind(this))
			.on("shutdown", this.onShutdown.bind(this));
	}

	/**
	 * Configure Accessory after Platform Init
	 */
	public configureAccessory(
		accessory: PlatformAccessory<AccessoryContext>,
	): void {
		this.accessories.push(accessory);
	}

	public getAccessoryId(
		configAccessory: ConfigAccessory,
		prefix?: Messages.disarmUpdate | Messages.zoneUpdate | string,
	): string {
		const accessoryLength: number = 3;
		const idNumber: string = Number(configAccessory.number)
			.toFixed()
			.padStart(accessoryLength, "0");

		const idPrefix: Messages.disarmUpdate | Messages.zoneUpdate | string = prefix
			?? (configAccessory.accessory === "security"
				? Messages.disarmUpdate
				: Messages.zoneUpdate);

		return idPrefix + idNumber;
	}

	/**
	 * Deprecate old Accessories which are invalid.
	 */
	private deprecateAccessories(): void {
		this.accessories
			.filter((accessory) => {
				return !this.configAccessories.some((configAccessory: ConfigAccessory) =>
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
			.forEach((configAccessory: ConfigAccessory) => {
				const uuid: string = this.api.hap.uuid.generate(this.getAccessoryId(configAccessory));

				let accessory: PlatformAccessory<AccessoryContext> | undefined =
					this.accessories.find((acc: PlatformAccessory<AccessoryContext>) =>
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

	private handleMessage(
		dataString: string,
	): void {
		let message: Message;

		switch (dataString.length) {
			// eslint-disable-next-line @typescript-eslint/no-magic-numbers
			case 2:
				message = {
					event: dataString[0] as MessageAlarmEvent,
					state: dataString.endsWith("Y"),
				};
				break;
			// eslint-disable-next-line @typescript-eslint/no-magic-numbers
			case 5:
				message = {
					event: dataString.slice(0, -1) as MessageStatusEvent,
					state: dataString.endsWith("1"),
				};
				break;
			default:
				message = {
					event: dataString as MessageAlarmEvent | MessageStatusEvent,
					state: false,
				};
		}

		this.accessoryEvent.emit(message.event, message.state);
	}

	private initAccessory(
		accessory: PlatformAccessory<AccessoryContext>,
		config: ConfigAccessory,
	): void {
		accessory.displayName = config.name;
		accessory.context.config = config;

		switch (config.accessory) {
			case "contact":
				new ContactSensorAccessory(this, accessory as PlatformAccessory<AccessoryContext<ConfigZone>>);
				break;
			case "smoke":
				new SmokeSensorAccessory(this, accessory as PlatformAccessory<AccessoryContext<ConfigZone>>);
				break;
			case "carbon-monoxide":
				new CarbonMonoxideSensorAccessory(this, accessory as PlatformAccessory<AccessoryContext<ConfigZone>>);
				break;
			case "security":
				new SecuritySystemAccessory(this, accessory as PlatformAccessory<AccessoryContext<ConfigArea>>);
				new SecuritySystemTargetAccessory(this, accessory as PlatformAccessory<AccessoryContext<ConfigArea>>);
				break;
			default:
				new MotionSensorAccessory(this, accessory as PlatformAccessory<AccessoryContext<ConfigZone>>);
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
		this.socketVerify();
	}

	private parseData(
		data: string,
	): void {
		const dataString: string | undefined = this.sanitiseEventData(data);

		if (dataString === undefined) {
			return;
		}

		this.log.debug("Socket Data:", dataString);
		this.lastSocketResponse = Date.now();

		if (!dataString.startsWith("\"")) {
			if (this.connection?.destroyed === false) {
				this.connection.destroy(new RangeError("Invalid data from SmartCOM"));
			}

			return;
		}

		this.handleMessage(dataString.substring(1));
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

		if (!Array.isArray(this.config.areas)) {
			this.config.areas = [];
		}

		if (!Array.isArray(this.config.zones)) {
			this.config.zones = [];
		}
	}

	private sanitiseEventData(
		data: unknown,
	): string | undefined {
		return typeof data === "string"
			? data
				.toString()
				.trim()
				.split("\n")
				.pop()
			: undefined;
	}

	/**
	 * Restarts the socket connection to SmartCom.
	 */
	private socketRestart(): void {
		this.log.info("Reconnecting to SmartCom - %s:%s", this.config.host, this.config.port);

		this.socketShutdown();

		const reconnectTimeout: number = 10000;

		global.setTimeout(
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

		this.lastSocketResponse = 0;
	}

	/**
	 * Start the socket connection to SmartCom.
	 */
	private socketStartUp(): void {
		this.connection = net
			.createConnection(this.config.port, this.config.host)
			.on("connect", () => {
				this.log.info("Connected to SmartCom - %s:%s", this.config.host, this.config.port);
			})
			.on("error", (error: Error & { code?: string }) => {
				if (error.code === "ECONNREFUSED") {
					this.log.error("Unable to connect to %s:%s", this.config.host, this.config.port);
				} else {
					this.log.error(error.message);
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

	private socketVerify(): void {
		const verificationTimeout: number = 10000;

		global.setTimeout(
			() => {
				if (this.lastSocketResponse === 0
					&& this.connection?.destroyed === false) {
					this.connection.destroy(new Error("No response from SmartCom"));
				}
			},
			verificationTimeout);
	}

}
