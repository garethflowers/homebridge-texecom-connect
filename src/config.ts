import { PlatformConfig } from 'homebridge';
import { ConfigZone } from './config-zone';

export interface Config
	extends PlatformConfig {

	host: string;

	port: number;

	zones: ConfigZone[];

}
