import { EventEmitter } from "events";
import { API, Characteristic, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service } from "homebridge";
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
import { PLATFORM_NAME, PLUGIN_NAME } from "./settings";
import { SocketCommand } from "./socket-command";
import { SocketCommandAction } from "./socket-command-action";

/**
 * Texecom Connect Platform.
 */
export class TexecomConnectPlatform implements DynamicPlatformPlugin {

	public readonly Service: typeof Service = this.api.hap.Service;

	public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

	public readonly accessories: PlatformAccessory<Record<string, ConfigAccessory>>[] = [];

	private connection?: net.Socket;

	public accessoryEvent: EventEmitter = new EventEmitter();

	private readonly configAccessories = [
		...(this.config as Config).areas ?? [],
		...(this.config as Config).zones ?? [],
	];

	public constructor(
		public readonly log: Logger,
		public readonly config: PlatformConfig,
		public readonly api: API,
	) {
		this.api
			.on("didFinishLaunching", this.onStartUp.bind(this))
			.on("shutdown", this.onShutdown.bind(this));
	}

	/**
	 * Configure Accessory after Platform Init
	 */
	public configureAccessory(
		accessory: PlatformAccessory<Record<string, ConfigAccessory>>,
	) {
		this.accessories.push(accessory);
	}

	/**
	 * Deprecate old Accessories which are invalid.
	 */
	private deprecateAccessories() {
		this.accessories
			.filter((accessory) =>
				!this.configAccessories.some((configAccessory: ConfigArea | ConfigZone) =>
					JSON.stringify(configAccessory) === JSON.stringify(accessory.context.config)))
			.forEach((accessory) => {
				this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
			});
	}

	public getAccessoryId(
		configAccessory: ConfigAccessory,
	): string {
		const number: string = Number(configAccessory.number)
			.toFixed()
			.padStart(3, "0");

		const prefix: "A" | "Z" = configAccessory.accessory === "security"
			? "A"
			: "Z";

		return prefix + number;
	}

	/**
	 * Discover new Accessories.
	 */
	private discoverDevices() {
		this.configAccessories.forEach((configAccessory: ConfigArea | ConfigZone) => {
			const uuid = this.api.hap.uuid.generate(this.getAccessoryId(configAccessory));

			let accessory: PlatformAccessory<Record<string, ConfigAccessory>> | undefined =
				this.accessories.find((accessory) => accessory.UUID === uuid);

			if (accessory === undefined) {
				accessory = new this.api.platformAccessory(configAccessory.name, uuid);
				this.accessories.push(accessory);
				this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
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
	 * Start the socket connection to SmartCom.
	 */
	private socketStartUp(): void {
		this.connection = net
			.createConnection(this.config.port as number, this.config.host as string)
			.on("connect", () => {
				this.log.debug("Socket: %s:%s", this.config.host, this.config.port);
			})
			.on("error", (error: Error) => {
				this.log.debug("Socket Error:", error);

				if ((error as unknown as { code: string }).code === "ECONNREFUSED") {
					this.log.error("Unable to connect to %s:%s", this.config.host, this.config.port);
				}
			})
			.on("close", (hadError: boolean) => {
				hadError
					? this.socketRestart()
					: this.log.debug("Socket Closed");
			})
			.on("data", this.parseData.bind(this));
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

		let action: SocketCommandAction | undefined;

		switch (dataString.substring(0, 2)) {
			case "\"Z":
				action = "zone";
				break;
			case "\"X":
				action = "area-arming";
				break;
			case "\"A":
				action = "area";
				break;
			case "\"D":
				action = "area-disarmed";
				break;
			default:
				action = undefined;
		}

		if (action === undefined) {
			return;
		}

		const parsedCommand: SocketCommand = {
			action,
			id: dataString.substring(1, 5),
			value: Number(dataString.substring(5)),
		};

		this.log.debug("Data:", parsedCommand);

		this.accessoryEvent.emit(parsedCommand.id, parsedCommand.value);
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
	 * Restarts the socket connection to SmartCom.
	 */
	private socketRestart(): void {
		this.log.debug("Socket Restart");

		this.socketShutdown();

		setTimeout(
			this.socketStartUp.bind(this),
			10000);
	}

	/**
	 * Start Up
	 */
	private onStartUp(): void {
		this.deprecateAccessories();
		this.discoverDevices();
		this.socketStartUp();
	}

	/**
	 * Shutdown
	 */
	private onShutdown(): void {
		this.socketShutdown();
	}

}
