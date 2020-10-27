import { EventEmitter } from "events";
import { API, Characteristic, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service } from "homebridge";
import * as net from "net";
import { CarbonMonoxideSensorAccessory } from "./accessory/carbon-monoxide-sensor-accessory";
import { ContactSensorAccessory } from "./accessory/contact-sensor-accessory";
import { MotionSensorAccessory } from "./accessory/motion-sensor-accessory";
import { SmokeSensorAccessory } from "./accessory/smoke-sensor-accessory";
import { Config } from "./config";
import { ConfigZone } from "./config-zone";
import { PLATFORM_NAME, PLUGIN_NAME } from "./settings";

/**
 * Texecom Connect Platform.
 */
export class TexecomConnectPlatform implements DynamicPlatformPlugin {

  public readonly Service: typeof Service = this.api.hap.Service;

  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  public readonly accessories: PlatformAccessory[] = [];

  private connection?: net.Socket;

  public accessoryEvent: EventEmitter = new EventEmitter();

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
    accessory: PlatformAccessory<Record<string, ConfigZone>>,
  ) {
    this.accessories.push(accessory);
  }

  /**
   * Deprecate old Accessories which are invalid.
   */
  private deprecateAccessories() {
    this.accessories
      .filter((accessory) =>
        !(this.config as Config).zones.some((zone: ConfigZone) =>
          JSON.stringify(zone) === JSON.stringify(accessory.context.zone)))
      .forEach((accessory) => {
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      });
  }

  public getZoneId(
    device: ConfigZone,
  ): string {
    return `Z${Number(device.number).toFixed().padStart(3, "0")}`;
  }

  /**
   * Discover new Accessories.
   */
  private discoverDevices() {
    for (const zone of (this.config as Config).zones) {
      const uuid = this.api.hap.uuid.generate(this.getZoneId(zone));

      const existingAccessory = this.accessories
        .find((accessory) => accessory.UUID === uuid);

      if (existingAccessory !== undefined) {
        this.initAccessory(existingAccessory, zone);
        this.api.updatePlatformAccessories([existingAccessory]);
      } else {
        const accessory = new this.api.platformAccessory(zone.name, uuid);
        this.accessories.push(accessory);

        this.initAccessory(accessory, zone);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }

  private initAccessory(
    accessory: PlatformAccessory,
    zone: ConfigZone,
  ): void {
    accessory.displayName = zone.name;
    accessory.context.zone = zone;

    switch (zone.sensor) {
      case "contact":
        new ContactSensorAccessory(this, accessory, zone);
        break;
      case "smoke":
        new SmokeSensorAccessory(this, accessory, zone);
        break;
      case "carbonmonoxide":
        new CarbonMonoxideSensorAccessory(this, accessory, zone);
        break;
      default:
        new MotionSensorAccessory(this, accessory, zone);
    }
  }

  /**
   * Start the socket connection to SmartCom.
   */
  private socketStartUp(): void {
    this.connection = net
      .createConnection(this.config.port as number, this.config.host as string)
      .on("connect", () => {
        this.log.debug("Socket Connected: %s:%s", this.config.host, this.config.port);
      })
      .on("error", (error) => {
        this.log.debug("Socket Error: ", error);
      })
      .on("close", () => {
        this.log.debug("Socket Closed");
      })
      .on("data", (data) => {
        const dataString: string = data
          .toString()
          .trim()
          .split("/n")
          .pop()
          ?? "";

        if (!dataString.startsWith("\"")) {
          this.socketRestart();

          return;
        }

        const parsedCommand = {
          action: Number(dataString.substr(5)),
          id: dataString.substr(1, 4),
        };

        this.log.debug("Socket Data: ", parsedCommand);
        this.accessoryEvent.emit(parsedCommand.id, parsedCommand.action);
      });
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
    this.log.debug("Socket restart");

    this.socketShutdown();

    setTimeout(this.socketStartUp.bind(this), 10000);
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
