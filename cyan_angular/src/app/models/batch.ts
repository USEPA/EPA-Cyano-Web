export class BatchJob {
	filename: string;
  locations: BatchLocation[];
  status: BatchStatus;
}

export class BatchLocation {
	latitude: number;
  longitude: number;
  type: string;	
}

export const csvKeys = [
  'latitude',
  'longitude',
  'type'
]

export class BatchStatus {
	job_id: string;
  job_status: string;	
  job_num: string = "";
}

export interface JobsTableParams {
  jobNum: string;
	jobId: string;
	jobStatus: string;
	inputFile: string;
	numLocations: number;
	receivedDatetime: string;
	// startedDatetime: string;
	finishedDatetime: string;
}

// "Jobs" table columns
export const columnNames = [
  {
    id: 'jobNum',
    value: 'Job'
    
  },
  {
    id: 'jobStatus',
    value: 'Status'
    
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
  // {
  //   id: 'startedDatetime',
  //   value: 'Started'
    
  // },
  {
    id: 'finishedDatetime',
    value: 'Finished'
    
  },
];
