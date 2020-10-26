import { API, Characteristic, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service } from 'homebridge';
import * as net from 'net';
import { Config } from './config';
import { ConfigZone } from './config-zone';
import { SensorAccessory } from './sensor-accessory';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class TexecomConnectPlatform implements DynamicPlatformPlugin {

  public readonly Service: typeof Service = this.api.hap.Service;

  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  private connection?: net.Socket;

  public constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.platform);

    this.api
      .on('didFinishLaunching', this.onStartUp.bind(this))
      .on('shutdown', this.onShutdown.bind(this));
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  public configureAccessory(accessory: PlatformAccessory<ConfigZone>) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  private deprecateDevices() {
    this.accessories.forEach((existingAccessory) => {
      const isDeprecated = (this.config as Config).zones.find((device) =>
        existingAccessory.UUID === this.api.hap.uuid.generate(`Z${Number(device.number).toFixed().padStart(3, '0')}`));

      if (!isDeprecated) {
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
      }
    });
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  private discoverDevices() {
    for (const device of (this.config as Config).zones) {
      this.log.info(`Z${Number(device.number).toFixed().padStart(3, '0')}`);
      const uuid = this.api.hap.uuid.generate(`Z${Number(device.number).toFixed().padStart(3, '0')}`);

      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      const displayName = `${device.name} ${device.sensor}`;

      if (existingAccessory) {
        if (device) {
          existingAccessory.displayName = displayName;
          existingAccessory.context.device = device;
          this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

          new SensorAccessory(this, existingAccessory);

          this.api.updatePlatformAccessories([existingAccessory]);
        }
      } else {

        this.log.info('Adding new accessory:', displayName);

        const accessory = new this.api.platformAccessory(displayName, uuid);

        accessory.context.device = device;

        new SensorAccessory(this, accessory);

        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }

  /**
   * Start the socket connection to SmartCom.
   */
  private socketStartUp(): void {
    this.connection = net
      .createConnection(this.config.port as number, this.config.host as string)
      .on('connect', () => {
        this.log.debug('Connected via IP');
      })
      .on('error', (error) => {
        this.log.debug('Socket Error: ', error);
      })
      .on('end', () => {
        this.log.debug('IP connection ended');
      })
      .on('close', () => {
        this.log.debug('IP connection closed');
      });

    if (this.connection) {
      this.connection.on('data', (data) => {
        const dataString: string = data
          .toString()
          .trim()
          .split('/n')
          .pop()
          ?? '';

        this.log.debug('SmartCom Event: ' + dataString);

        if (!dataString.startsWith('"')) {
          this.socketRestart();

          return;
        }

        const uuid = this.api.hap.uuid.generate(dataString.substr(1, 4));

        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);

        existingAccessory
          ?.getService(this.Service.MotionSensor)
          ?.getCharacteristic(this.Characteristic.MotionDetected)
          .setValue(dataString.substr(5) === '1');
      });
    }
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
    this.log.debug('Socket restart');

    this.socketShutdown();

    setTimeout(this.socketStartUp.bind(this), 5000);
  }

  private onStartUp(): void {
    this.deprecateDevices();
    this.discoverDevices();

    this.socketStartUp();
  }

  private onShutdown(): void {
    this.socketShutdown();
  }

}
