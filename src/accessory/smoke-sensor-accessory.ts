import { PlatformAccessory } from "homebridge";
import { ConfigZone } from "../config-zone";
import { TexecomConnectPlatform } from "../texecom-connect-platform";
import { TexecomAccessory } from "./texecom-accessory";

/**
 * Smoke Sensor Accessory
 */
export class SmokeSensorAccessory
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
      platform.Service.SmokeSensor);
  }

  protected listener(
    value: number,
  ): void {
    this.service
      .getCharacteristic(this.platform.Characteristic.SmokeDetected)
      .setValue(value === this.platform.Characteristic.SmokeDetected.SMOKE_DETECTED
        ? this.platform.Characteristic.SmokeDetected.SMOKE_DETECTED
        : this.platform.Characteristic.SmokeDetected.SMOKE_NOT_DETECTED);
  }

}
