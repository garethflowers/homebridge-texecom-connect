import { API } from "homebridge";
import { platformName } from "./settings";
import { TexecomConnectPlatform } from "./texecom-connect-platform";

/**
 * Register the platform with Homebridge.
 */
export = (api: API): void => {
	api.registerPlatform(platformName, TexecomConnectPlatform);
};
