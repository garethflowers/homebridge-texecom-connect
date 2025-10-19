import { CharacteristicValue, PlatformAccessory } from "homebridge";

import { ConfigArea } from "../config/config-area";
import { AccessoryContext } from "../interfaces/accessory-context";
import { Messages } from "../interfaces/messages";
import { TexecomConnectPlatform } from "../texecom-connect-platform";

import { TexecomAreaAccessory } from "./texecom-area-accessory";

/**
 * Security System Target Accessory
 */
export class SecuritySystemTargetAccessory
	extends TexecomAreaAccessory {

	private readonly retryDelay: number;

	public constructor(
		platform: TexecomConnectPlatform,
		accessory: PlatformAccessory<AccessoryContext<ConfigArea>>,
	) {
		super(
			platform,
			accessory,
			platform.service.SecuritySystem,
			platform.characteristic.SecuritySystemTargetState,
			platform.characteristic.SecuritySystemTargetState.DISARM);

		this.retryDelay = 2000;

		// TODO
		/* global.setTimeout(() =>{
			void this.setCharacteristic(this.platform.characteristic.SecuritySystemTargetState.STAY_ARM);
		}, 60000); */
	}

	protected listener(): void {
		return;
	}

	protected override async setCharacteristic(
		value: CharacteristicValue,
	): Promise<void> {
		super.setCharacteristic(value);

		let state: string = "Off";

		switch (value) {
			case this.platform.characteristic.SecuritySystemTargetState.STAY_ARM:
				state = "Home";
				break;
			case this.platform.characteristic.SecuritySystemTargetState.AWAY_ARM:
				state = "Away";
				break;
			case this.platform.characteristic.SecuritySystemTargetState.NIGHT_ARM:
				state = "Night";
				break;
			default:
		}

		await this.applyTargetState(state);
	}

	private async applyTargetState(state: string): Promise<void> {
		this.platform.log.info(
			"%s : Security System Mode Change Requested : %s",
			this.config.name,
			state);

		if (this.config.userCode === undefined) {
			this.platform.log.error(
				"%s : Security System Mode Change Failed : %s",
				this.config.name,
				"Invalid User Code");

			return;
		}

		try {
			await this.processCommand(`W${this.config.userCode}`, 2);
		} catch (error) {
			this.platform.log.error(
				"%s : Security System Mode Change Failed : %s",
				this.config.name,
				error);
		}

		this.platform.log.info(
			"%s : Security System Mode Change Completed : %s",
			this.config.name,
			state);
	}

	private async processCommand(command: string, retryCount: number = 1): Promise<boolean> {
		return new Promise((resolve: (value: boolean) => void, reject: (reason: Error) => void) => {
			const handleData = (data: string | Buffer): void => {
				if (data.toString().trim() !== Messages.successful) {
					return;
				}

				this.platform.connection?.removeListener("data", handleData);
				resolve(true);
			};

			this.platform.connection?.on("data", handleData);
console.warn(command);

			if (this.platform.connection?.writable === true) {
				this.platform.connection.write(`\\${command}/`, (error?: Error) => {
					if (error !== null && error !== undefined) {
						this.platform.log.error("%s : Command failed : %s", this.config.name, error);
						reject(error);

						return;
					}

					this.platform.log.debug("%s : Command sent: %s", this.config.name, command);
				});
			}

			global.setTimeout(() => {
				this.platform.connection?.removeListener("data", handleData);

				if (retryCount === 0) {
					reject(new Error("Timeout sending command"));

					return;
				}

				this.platform.log.debug("%s : Command retry: %s", this.config.name, retryCount);

				this.processCommand(command, retryCount - 1)
					.then(resolve)
					.catch(reject);
			}, this.retryDelay);
		});
	}

}
