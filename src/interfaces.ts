import * as PIXI from 'pixi.js';
export interface VisStimConfig {
  start_baseline_s: number;
  start_fixation_ms: number;
  num_repeat: number;
  show_time_ms: number;
  end_white_ms: number;
  end_baseline_s: number;
  jitter_ms: number;
}

export interface StimInfo {
  file: File;
  sprite: PIXI.Sprite;
}

export interface StimulusSetInfo {
  num_repeat: number;
  show_time_ms: number;
  stim_info: StimInfo[];
}

export type EventDetailType = "Pre-baseline"
export type EventDetailEvent = "start" | "end"

export interface EventDetail {
  stim_i?: number;
  stim_set_num?: number;
  stim_seq_num?: number;
  stim_file_name?: string;
  type?: string;
  event?: string;
}

export interface StimEvent {
  event: EventDetail;
  epoch_time_ms: number;
}