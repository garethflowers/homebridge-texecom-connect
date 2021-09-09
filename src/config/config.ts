import { PlatformConfig } from "homebridge";
import { ConfigArea } from "./config-area";
import { ConfigZone } from "./config-zone";

export interface Config
	extends PlatformConfig {

	areas: readonly ConfigArea[];

	host: string;

	port: number;

	zones: readonly ConfigZone[];

}
