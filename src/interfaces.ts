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