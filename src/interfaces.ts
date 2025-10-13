export interface VisStimConfig {
  start_baseline_s: number;
  start_fixation_ms: number;
  num_repeat: number;
  show_time_ms: number;
  end_white_ms: number;
  end_baseline_s: number;
}

export interface StimulusSetInfo {
  filelist: FileList;
  num_repeat: number;
  show_time_ms: number;
}