// export class BatchJob {
// 	filename: string;
//   locations: BatchLocation[];
//   status: BatchStatus;
// }
// export class BatchLocation {
// 	latitude: number;
//   longitude: number;
//   type: string;	
// }
// export const csvKeys = [
//   'latitude',
//   'longitude',
//   'type'
// ]

export class ReportStatus {
	report_id: string;
  report_status: string;	
  report_num: string = "";
}

export interface ReportsTableParams {
  report_num: string;
  report_status: string;
  report_id: string;
  received_datetime: string;
  finished_datetime: string;
  report_date: string;
  report_objectids: string;
  report_tribes: string;
  report_counties: string;
  report_ranges: string;
}

// "Reports" table columns
export const columnNames = [
  {
    id: 'report_num',
    value: 'Report'
    
  },
  {
    id: 'report_status',
    value: 'Status'
    
  },
  {
    id: 'report_id',
    value: 'Report ID'
  },
  {
    id: 'received_datetime',
    value: 'Received'
    
  },
  {
    id: 'finished_datetime',
    value: 'Finished'
    
  },
  {
    id: 'report_date',
    value: 'Report Date'
    
  },
  {
    id: 'report_objectids',
    value: 'Object IDs'
  },
  {
    id: 'report_tribes',
    value: 'Tribes'
  },
  {
    id: 'report_counties',
    value: 'Counties'
  },
  {
    id: 'report_ranges',
    value: 'Ranges'
  }
];
