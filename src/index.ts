import { API } from "homebridge";
import { PLATFORM_NAME } from "./settings";
import { TexecomConnectPlatform } from "./texecom-connect-platform";

/**
 * This method registers the platform with Homebridge
 */
export = (api: API): void => {
	api.registerPlatform(PLATFORM_NAME, TexecomConnectPlatform);
};
