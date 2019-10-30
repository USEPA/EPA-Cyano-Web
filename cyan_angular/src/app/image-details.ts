export class Coordinates {
    topLeftX: number;
    topLeftY: number;
    topRightX: number;
    topRightY: number;
    bottomLeftX: number;
    bottomLeftY: number;
    bottomRightX: number;
    bottomRightY: number;
}
  
export interface ImageDetails {
    name: string;
    width: number;
    height: number;
    format: string;
    thumb: boolean,
    thumbDependencyImageName: string;
    coordinates: Coordinates;
    satelliteImageType: string;
    satelliteImageFrequency: string;
}