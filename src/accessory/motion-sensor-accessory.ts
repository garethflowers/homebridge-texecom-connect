import { PlatformAccessory } from 'homebridge';
import { ConfigZone } from '../config-zone';
import { TexecomConnectPlatform } from '../texecom-connect-platform';
import { TexecomAccessory } from './texecom-accessory';

/**
 * Motion Sensor Accessory
 */
export class MotionSensorAccessory
  extends TexecomAccessory {

  public constructor(
    platform: TexecomConnectPlatform,
    accessory: PlatformAccessory,
    zone: ConfigZone,
  ) {
    super(
      platform,
      accessory,
      zone,
      platform.Service.MotionSensor);
  }

  protected listener(
    value: number,
  ): void {
    this.service
      .getCharacteristic(this.platform.Characteristic.MotionDetected)
      .setValue(value);
  }

}
