export class BatchJob {
	filename: string;
  locations: BatchLocation[]
}

export class BatchLocation {
	lat: number;
  lon: number;
  type: string;	
}

export class BatchStatus {
	job_id: string;
  job_status: string;	
}