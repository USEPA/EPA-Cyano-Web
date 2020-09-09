/*
Model for location result from nominatim.openstreetmap.org API.
*/

export class LocationResult {
	place_id: number;
    licence: string;
    osm_type: string;
    osm_id: number;
    // boundingbox: LocationResultBoundingBox[];
    boundingbox: string[];
    lat: string;
    lon: string;
    display_name: string;
    class: string;
    type: string;
    importance: number;
    icon: string;
}

export class LocationResultBoundingBox {
	sLat: string;  // south latitude
	nLat: string;  // north latitude
	wLon: string;  // west longitude
	eLong: string;  // east longitude
}