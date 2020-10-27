export interface ConfigZone {

	name: string;

	number: number;

	sensor:
	| 'carbonmonoxide'
	| 'contact'
	| 'motion'
	| 'smoke';

}
