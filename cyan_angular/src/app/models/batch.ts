export class BatchJob {
	filename: string;
  locations: BatchLocation[];
  status: BatchStatus;
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

export interface JobsTableParams {
	jobId: string;
	jobStatus: string;
	inputFile: string;
	numLocations: number;
	receivedDatetime: string;
	startedDatetime: string;
	finishedDatetime: string;
}

export const jobsTableCols = [
	'jobId',
	'jobStatus',
	'inputFile',
	'numLocations',
	'receivedDatetime',
	'startedDatetime',
	'finishedDatetime'
]

export const columnNames = [
  {
    id: 'jobId',
    value: 'Job ID'
    
  },
  {
    id: 'jobStatus',
    value: 'Job Status'
    
  },
  {
    id: 'inputFile',
    value: 'Input File'
    
  },
  {
    id: 'numLocations',
    value: 'Num Locations'
    
  },
  {
    id: 'receivedDatetime',
    value: 'Received'
    
  },
  {
    id: 'startedDatetime',
    value: 'Started'
    
  },
  {
    id: 'finishedDatetime',
    value: 'Finished'
    
  },
];
