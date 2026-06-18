export interface TrackingStartResponse {
  ignored: {
    inactive: number[];
    invalid: number[];
    missing: number[];
    missing_coords: number[];
  };
  started_ids: number[];
}

export interface TrackingStopResponse {
  invalid: number[];
  not_tracking: number[];
  stopped_all: boolean;
  stopped_ids: number[];
}
