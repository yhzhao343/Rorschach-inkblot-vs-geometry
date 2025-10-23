import { VisStimConfig, StimulusSetInfo, StimEvent } from "./interfaces";
import {
  openFullscreen,
  pixi_large_text,
  shuffle,
  any,
  epochTimestamp,
  pixi_huge_text,
  getRandomFloat,
  download,
  closeFullscreen,
} from "./helpers";
import * as PIXI from "pixi.js";

const app = new PIXI.Application();

const defaultConfig: VisStimConfig = {
  start_baseline_s: 180,
  start_fixation_ms: 1500,
  num_repeat: 3,
  show_time_ms: 5000,
  end_white_ms: 1500,
  end_baseline_s: 180,
  jitter_ms: 500,
};

const DATA_SERVER_PORT = 3200;
const VISUAL_STIM_PATH = "image_visual_stim_in";
const WS_URL = `ws://127.0.0.1:${DATA_SERVER_PORT}/${VISUAL_STIM_PATH}`;
let socket: WebSocket | undefined;
const MAX_RECONNECT = 5;
let reconnect_count = 0;
let reconnect_timeout: number;

export function getDefaultStartConfig(): VisStimConfig {
  return { ...defaultConfig };
}

export function startConfigFromUrl() {
  const params: URLSearchParams = new URLSearchParams(window.location.search);
  return updateConfig(params);
}

export function updateConfig(
  params: URLSearchParams,
  input_config: VisStimConfig = defaultConfig,
) {
  let config = { ...input_config };
  for (const key of Object.keys(config)) {
    const param_val = params.get(key);
    if (param_val) {
      if (typeof config[key] === "number") config[key] = parseFloat(param_val);
    }
  }
  return config;
}

export function updateSearchURL(start_config: VisStimConfig) {
  const curr_url_search_string = window.location.search;
  const url_params: URLSearchParams = new URLSearchParams(
    curr_url_search_string,
  );
  for (const [key, val] of Object.entries(start_config)) {
    url_params.set(key, val);
  }
  if (url_params.toString() !== curr_url_search_string) {
    const new_url = `${window.location.protocol}//${window.location.host}${window.location.pathname}?${url_params.toString()}`;
    window.history.pushState({ path: new_url }, "", new_url);
  }
}

async function setupPixiApp(parentElement: HTMLElement) {
  await app.init({
    resizeTo: window,
    background: 0xffffff,
    autoDensity: true,
  });
  // const container = document.getElementById('app-container');
  if (typeof parentElement === "undefined") {
    parentElement = document.createElement("div");
    document.body.appendChild(parentElement);
  }

  if (parentElement) {
    parentElement.appendChild(app.canvas as HTMLCanvasElement);
  } else {
    console.error("Could not find the 'app-container' element.");
  }
  return app.canvas;
}

export async function prepVisStimCtrlPanel(
  start_config: VisStimConfig,
  parentElement?: HTMLElement,
) {
  updateSearchURL(start_config);
  // console.log(start_config);

  const control_panel_div = document.createElement("div");
  control_panel_div.classList.add("control-panel-div");
  if (typeof parentElement === "undefined") {
    parentElement = document.createElement("div");
    document.body.appendChild(parentElement);
  }

  parentElement.appendChild(control_panel_div);
  await setupPixiApp(parentElement);
  app.canvas.classList.add("hide");

  const timing_form = createDiv("timing_form", control_panel_div, [
    "flat-form",
  ]);
  control_panel_div.appendChild(timing_form);

  const start_baseline_input_id = "start_baseline_time_s";
  const start_baseline_label = createLabel(
    "start_baseline_time_span",
    timing_form,
    start_baseline_input_id,
    ["form-label", "label-lg"],
    "Start Baseline(s):",
  );

  const start_baseline_input = createNumInput(
    start_baseline_input_id,
    timing_form,
    ["form-input", "input-lg"],
    5,
    300,
    1,
    start_config.start_baseline_s,
  );
  start_baseline_input.setAttribute(
    "style",
    "width:4em;margin-right: 10px;margin-left:5px;",
  );

  const end_baseline_input_id = "end_baseline_time_s";
  const end_baseline_label = createLabel(
    "end_baseline_time_span",
    timing_form,
    end_baseline_input_id,
    ["form-label", "label-lg"],
    "End Baseline(s):",
  );

  const end_baseline_input = createNumInput(
    end_baseline_input_id,
    timing_form,
    ["form-input", "input-lg"],
    5,
    300,
    1,
    start_config.end_baseline_s,
  );
  end_baseline_input.setAttribute(
    "style",
    "width:4em;margin-right: 10px;margin-left:5px;",
  );

  const start_fixation_input_id = "start_fixation_time_ms";
  const start_fixation_label = createLabel(
    "start_fixation_time_span",
    timing_form,
    start_fixation_input_id,
    ["form-label", "label-lg"],
    "Start Fixation (ms):",
  );

  const start_fixation_input = createNumInput(
    start_fixation_input_id,
    timing_form,
    ["form-input", "input-lg"],
    1000,
    10000,
    1,
    start_config.start_fixation_ms,
  );
  start_fixation_input.setAttribute(
    "style",
    "width: 4.5em;margin-right: 10px;margin-left:5px;",
  );

  const end_white_input_id = "end_white_time_ms";
  const end_white_label = createLabel(
    "end_white_time_span",
    timing_form,
    end_white_input_id,
    ["form-label", "label-lg"],
    "End White (ms):",
  );

  const end_white_input = createNumInput(
    end_white_input_id,
    timing_form,
    ["form-input", "input-lg"],
    1000,
    10000,
    1,
    start_config.end_white_ms,
  );
  end_white_input.setAttribute(
    "style",
    "width: 4.5em;margin-right: 10px;margin-left:5px;",
  );

  const jitter_input_id = "jitter_time_ms";
  const jitter_label = createLabel(
    "jitter_time_span",
    timing_form,
    jitter_input_id,
    ["form-label", "label-lg"],
    "Jitter time (ms):",
  );

  const jitter_input = createNumInput(
    jitter_input_id,
    timing_form,
    ["form-input", "input-lg"],
    0,
    1000,
    1,
    start_config.jitter_ms,
  );
  jitter_input.setAttribute(
    "style",
    "width: 4.5em;margin-right: 10px;margin-left:5px;",
  );

  start_baseline_input.onchange = (event: Event) => {
    if (event.target) {
      if ("value" in event.target) {
        if (typeof event.target.value === "number") {
          start_config.start_baseline_s = event.target.value;
        } else if (typeof event.target.value === "string") {
          start_config.start_baseline_s = parseFloat(event.target.value);
        }
      }
    }
    start_baseline_input.value = start_config.start_baseline_s.toString();
    updateSearchURL(start_config);
  };

  end_baseline_input.onchange = (event: Event) => {
    if (event.target) {
      if ("value" in event.target) {
        if (typeof event.target.value === "number") {
          start_config.end_baseline_s = event.target.value;
        } else if (typeof event.target.value === "string") {
          start_config.end_baseline_s = parseFloat(event.target.value);
        }
      }
    }
    end_baseline_input.value = start_config.end_baseline_s.toString();
    updateSearchURL(start_config);
  };

  start_fixation_input.onchange = (event: Event) => {
    if (event.target) {
      if ("value" in event.target) {
        if (typeof event.target.value === "number") {
          start_config.start_fixation_ms = event.target.value;
        } else if (typeof event.target.value === "string") {
          start_config.start_fixation_ms = parseFloat(event.target.value);
        }
      }
    }
    start_fixation_input.value = start_config.start_fixation_ms.toString();
    updateSearchURL(start_config);
  };

  end_white_input.onchange = (event: Event) => {
    if (event.target) {
      if ("value" in event.target) {
        if (typeof event.target.value === "number") {
          start_config.end_white_ms = event.target.value;
        } else if (typeof event.target.value === "string") {
          start_config.end_white_ms = parseFloat(event.target.value);
        }
      }
    }
    end_white_input.value = start_config.end_white_ms.toString();
    updateSearchURL(start_config);
  };

  const add_vis_stim_in = document.createElement("input");
  add_vis_stim_in.setAttribute("type", "file");
  add_vis_stim_in.setAttribute("id", "vis-stim-upload");
  add_vis_stim_in.setAttribute("style", "display:none");
  add_vis_stim_in.setAttribute("accept", "image/*");
  add_vis_stim_in.multiple = true;
  add_vis_stim_in.onchange = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const files = target.files as FileList;
    if (files.length > 0) {
      await addVisStimSet(files);
    }
  };

  const add_vis_sim_btn = document.createElement("button");
  add_vis_sim_btn.classList.add("btn", "btn-lg", "btn-primary");

  add_vis_sim_btn.innerHTML = "Add Stim Set";
  timing_form.appendChild(add_vis_sim_btn);
  add_vis_sim_btn.onclick = () => {
    add_vis_stim_in.click();
  };

  const vis_stim = createDiv("vis_stim", control_panel_div, [
    "flat-flex-col",
    "yscroll",
  ]);
  // vis_stim.setAttribute("style", "width:100%");
  control_panel_div.appendChild(vis_stim);
  const stim_info_list: StimulusSetInfo[] = [];

  const play_stim_div = createDiv("play_stim", control_panel_div, [
    "flat-flex-row",
  ]);
  // play_stim_div.setAttribute("style", "width:100%;margin-top:2vh");
  control_panel_div.appendChild(play_stim_div);

  let show_progress = true;
  const show_progress_set = createSwitch("Show progress", (event: any) => {
    if (event.target?.checked) {
      show_progress = true;
    } else {
      show_progress = false;
    }
  });
  const show_progress_input = show_progress_set.children.item(
    0,
  ) as HTMLInputElement;
  show_progress_input.disabled = true;
  show_progress_input.checked = show_progress;
  // shuffle_between_set.classList.add("width_12vw");
  play_stim_div.appendChild(show_progress_set);

  let shuffle_between = true;
  const shuffle_between_set = createSwitch(
    "Shuffle between set",
    (event: any) => {
      if (event.target?.checked) {
        shuffle_between = true;
      } else {
        shuffle_between = false;
      }
    },
  );
  const shuffle_between_input = shuffle_between_set.children.item(
    0,
  ) as HTMLInputElement;
  shuffle_between_input.disabled = true;
  shuffle_between_input.checked = shuffle_between;
  // shuffle_between_set.classList.add("width_12vw");
  play_stim_div.appendChild(shuffle_between_set);

  let shuffle_within = true;
  const shuffle_within_set = createSwitch(
    "Shuffle within set",
    (event: any) => {
      if (event.target?.checked) {
        shuffle_within = true;
      } else {
        shuffle_within = false;
      }
    },
  );
  const shuffle_within_input = shuffle_within_set.children.item(
    0,
  ) as HTMLInputElement;
  shuffle_within_input.disabled = true;
  shuffle_within_input.checked = shuffle_within;
  // shuffle_within_set.classList.add("width_12vw");
  play_stim_div.appendChild(shuffle_within_set);

  const play_stim_button = document.createElement("button");
  play_stim_button.classList.add("btn", "btn-lg", "btn-primary");
  play_stim_button.disabled = true;
  play_stim_button.textContent = "Start experiment";
  play_stim_div.appendChild(play_stim_button);
  let timeout = 0;

  let my_promise: Promise<any>;
  let stim_order_i = -1;
  let stim_set_i = -1;
  let stim_seq_i = -1;
  let event_list: StimEvent[] = [];

  function eventGen(
    type: string,
    event: string,
    epoch_time_ms: number | undefined = undefined,
    stim_order_i: number | undefined = undefined,
    stim_set_i: number | undefined = undefined,
    stim_seq_i: number | undefined = undefined,
  ) {
    const e: StimEvent = {
      type: type,
      event: event,
    };
    if (epoch_time_ms !== undefined) {
      e.epoch_time_ms = epoch_time_ms;
    }
    if (stim_order_i !== undefined) {
      e.stim_order_i = stim_order_i;
    }

    if (stim_set_i !== undefined) {
      e.stim_set_num = stim_set_i;
    }

    if (stim_seq_i !== undefined) {
      e.stim_seq_num = stim_seq_i;
    }

    if (stim_set_i !== undefined && stim_seq_i !== undefined) {
      if (stim_set_i > -1 && stim_seq_i > -1) {
        e.stim_file_name =
          stim_info_list[stim_set_i].stim_info[stim_seq_i].file.name;
      }
    }
    return e;
  }

  play_stim_button.onclick = (event: Event) => {
    event_list = [];
    const stim_seq = generateStimSeq(
      stim_info_list,
      shuffle_within,
      shuffle_between,
    );
    my_promise = Promise.resolve();
    document.addEventListener("keydown", on_key_down);
    control_panel_div.classList.add("hide");
    app.canvas.classList.remove("hide");
    openFullscreen();
    for (let stim_set_i = 0; stim_set_i < stim_info_list.length; stim_set_i++) {
      const stim_set = stim_info_list[stim_set_i];
      for (let stim_i = 0; stim_i < stim_set.stim_info.length; stim_i++) {
        stim_set.stim_info[stim_i].sprite.x = app.screen.width / 2;
        stim_set.stim_info[stim_i].sprite.y = app.screen.height / 2;
      }
    }
    my_promise
      .then(start)
      .then(preBaselineStart)
      .then(show_stim_sequence(stim_seq, show_progress))
      .then(postBaselineStart)
      .then(closeFullscreen)
      .then(exitExperiment);
  };
  //
  function clearCanvas() {
    app.stage.removeChildren();
  }
  function start(count_down = 5, interval_ms = 1000) {
    for (let i = count_down; i > 0; i--) {
      my_promise = my_promise.then(delay_ms(interval_ms)).then(() => {
        app.ticker.addOnce(() => {
          app.stage.removeChildren();
          showPixiText(`${i}`);
          const timestamp = epochTimestamp();
        });
      });
    }
    my_promise = my_promise.then(delay_ms(interval_ms)).then(clearCanvas);
    return my_promise;
  }

  function preBaselineStart() {
    if (start_config.start_baseline_s > 0) {
      const start_e: StimEvent = eventGen("Pre-baseline", "start");
      const end_e: StimEvent = eventGen("Pre-baseline", "end");
      my_promise = my_promise
        .then(() => {
          app.ticker.addOnce(() => {
            app.stage.removeChildren();
            showPixiText(
              `Pre-experiment baseline\n Please rest and stay calm for ${start_config.start_baseline_s}s with eyes open`,
            );
            start_e.epoch_time_ms = epochTimestamp();
            addToEventList(start_e);
          });
        })
        .then(delay_ms(start_config.start_baseline_s * 1e3))
        .then(() => {
          app.ticker.addOnce(() => {
            app.stage.removeChildren();
            end_e.epoch_time_ms = epochTimestamp();
            addToEventList(end_e);
          });
        });
    }
    return my_promise;
  }

  function postBaselineStart() {
    if (start_config.end_baseline_s > 0) {
      const start_e: StimEvent = eventGen("Post-baseline", "start");
      const end_e: StimEvent = eventGen("Post-baseline", "end");
      my_promise = my_promise
        .then(() => {
          app.ticker.addOnce(() => {
            app.stage.removeChildren();
            showPixiText(
              `Post-experiment baseline\n Please rest and stay calm for ${start_config.start_baseline_s}s with eyes open`,
            );
            start_e.epoch_time_ms = epochTimestamp();
            addToEventList(start_e);
          });
        })
        .then(delay_ms(start_config.end_baseline_s * 1e3))
        .then(() => {
          app.ticker.addOnce(() => {
            app.stage.removeChildren();
            end_e.epoch_time_ms = epochTimestamp();
            addToEventList(end_e);
          });
        });
    }
    return my_promise;
  }

  function event_end(
    type: string,
    event: string,
    stim_order_i: number | undefined = undefined,
    stim_set_i: number | undefined = undefined,
    stim_seq_i: number | undefined = undefined,
  ) {
    const e: StimEvent = eventGen(
      type,
      event,
      undefined,
      stim_order_i,
      stim_set_i,
      stim_seq_i,
    );
    return () => {
      app.ticker.addOnce(() => {
        app.stage.removeChildren();
        e.epoch_time_ms = epochTimestamp();
        addToEventList(e);
      });
    };
  }

  function show_stim_sequence(stim_seq: number[][], show_stim_sequence = true) {
    return () => {
      for (let i = 0; i < stim_seq.length; i++) {
        stim_order_i = i;
        stim_set_i = stim_seq[i][0];
        stim_seq_i = stim_seq[i][1];
        const sprite = stim_info_list[stim_set_i].stim_info[stim_seq_i].sprite;
        sprite.x = app.screen.width / 2;
        sprite.y = app.screen.height / 2;

        const fixation_time_ms =
          start_config.start_fixation_ms +
          getRandomFloat(0, start_config.jitter_ms);
        if (fixation_time_ms > 0) {
          my_promise = my_promise
            .then(
              function () {
                app.ticker.addOnce(
                  function () {
                    app.stage.removeChildren();
                    showPixiText(`+`, pixi_huge_text);
                    addToEventList(
                      eventGen(
                        "show fixation",
                        "start",
                        epochTimestamp(),
                        this.stim_order_i,
                        this.stim_set_i,
                        this.stim_seq_i,
                      ),
                    );
                  }.bind(this),
                );
              }.bind({ stim_order_i, stim_set_i, stim_seq_i }),
            )
            .then(delay_ms(fixation_time_ms))
            .then(
              event_end(
                "show fixation",
                "end",
                stim_order_i,
                stim_set_i,
                stim_seq_i,
              ),
            );
        }

        my_promise = my_promise
          .then(
            function () {
              app.ticker.addOnce(
                function () {
                  app.stage.addChild(sprite);
                  const timestamp = epochTimestamp();
                  addToEventList(
                    eventGen(
                      "show stim",
                      "start",
                      timestamp,
                      this.stim_order_i,
                      this.stim_set_i,
                      this.stim_seq_i,
                    ),
                  );
                }.bind(this),
              );
            }.bind({ stim_order_i, stim_set_i, stim_seq_i }),
          )
          .then(delay_ms(stim_info_list[stim_set_i].show_time_ms))
          .then(
            event_end("show stim", "end", stim_order_i, stim_set_i, stim_seq_i),
          );

        if (start_config.end_white_ms > 0) {
          my_promise = my_promise
            .then(
              function () {
                app.ticker.addOnce(
                  function () {
                    app.stage.removeChildren();
                    if (show_stim_sequence) {
                      showPixiText(
                        `Progress\n${i + 1}/${stim_seq.length}`,
                        pixi_huge_text,
                      );
                    }
                    const timestamp = epochTimestamp();
                    addToEventList(
                      eventGen(
                        "show post stim",
                        "start",
                        timestamp,
                        this.stim_order_i,
                        this.stim_set_i,
                        this.stim_seq_i,
                      ),
                    );
                  }.bind(this),
                );
              }.bind({ stim_order_i, stim_set_i, stim_seq_i }),
            )
            .then(delay_ms(start_config.end_white_ms))
            .then(
              event_end(
                "show post stim",
                "end",
                stim_order_i,
                stim_set_i,
                stim_seq_i,
              ),
            );
        }
      }
      return my_promise;
    };
  }

  function delay(time_ms: number, callback: Function | null = null) {
    return new Promise((resolve, reject) => {
      timeout = setTimeout(() => {
        try {
          if (callback) {
            resolve(callback());
          } else {
            resolve(null);
          }
        } catch (err) {
          reject(err);
        }
      }, time_ms);
    });
  }
  function delay_ms(time_ms: number) {
    return () => delay(time_ms);
  }

  function exitExperiment() {
    clearTimeout(timeout);
    my_promise.finally();
    document.removeEventListener("keydown", on_key_down);
    app.stage.removeChildren();
    app.canvas.classList.add("hide");
    control_panel_div.classList.remove("hide");
    if (event_list.length > 0) {
      download("visual_stimuli_events", JSON.stringify(event_list, null, 2));
    }
  }

  function on_key_down(event: KeyboardEvent) {
    if (event.key === "Escape") {
      exitExperiment();
    } else {
      addToEventList(eventGen("keydown", event.key, epochTimestamp()));
    }
  }

  function addToEventList(e: StimEvent, verbose = true) {
    event_list.push(e);
    console.log(`Socket open: ${socket?.readyState === WebSocket.OPEN}`);
    if (socket?.readyState === WebSocket.OPEN) {
      const event = Object.assign({}, e);
      setTimeout(() => {
        if (socket?.readyState === WebSocket.OPEN) {
          console.log(
            `   Pre send socket open: ${socket?.readyState === WebSocket.OPEN}`,
          );
          event.send_epoch_time_ms = epochTimestamp();
          console.log(event);
          socket.send(JSON.stringify(event));
        }
      }, 0);
    }
    if (verbose) {
      console.log(e);
    }
  }

  async function addVisStimSet(files: FileList) {
    const info: StimulusSetInfo = {
      stim_info: [],
      num_repeat: start_config.num_repeat,
      show_time_ms: start_config.show_time_ms,
    };
    stim_info_list.push(info);
    const files_arr = Array.from(files);
    files_arr.reverse();
    const id_num = vis_stim.children.length;
    const vis_stim_row = createDiv(`Vis-stim-row-${id_num}`, vis_stim, []);
    vis_stim_row.setAttribute(
      "style",
      "border-bottom: 1px solid #a5a5a5;border-top: 1px solid #a5a5a5;",
    );
    const setting_div = createDiv(`Vis-stim-${id_num}-settings`, vis_stim_row, [
      "vis-stim-row",
    ]);
    const stim_row_div = createDiv(`Vis-stim-${id_num}`, vis_stim_row, [
      "vis-stim-row",
    ]);

    const title_header = createDiv(
      `img-card-header-content-${id_num}`,
      setting_div,
      ["h6", "center"],
      `Set ${id_num}: ${files_arr.length} stimuli`,
    );
    title_header.setAttribute("style", "margin-right: 20px");

    const num_repeat_input_id = "num_repeat_time_s";
    const num_repeat_label = createLabel(
      "num_repeat_time_span",
      setting_div,
      num_repeat_input_id,
      ["form-label"],
      "# repeat each:",
    );

    const num_repeat_input = createNumInput(
      num_repeat_input_id,
      setting_div,
      ["form-input"],
      1,
      100,
      1,
      start_config.num_repeat,
    );
    num_repeat_input.setAttribute(
      "style",
      "width:3em;margin-right: 10px;margin-left:5px;",
    );
    num_repeat_input.onchange = (event: Event) => {
      if (event.target) {
        if ("value" in event.target) {
          if (typeof event.target.value === "number") {
            info.num_repeat = event.target.value;
          } else if (typeof event.target.value === "string") {
            info.num_repeat = parseInt(event.target.value);
          }
        }
      }
    };

    const stim_show_time_input_id = "stim_show_time_time_s";
    const stim_show_time_label = createLabel(
      "stim_show_time_time_span",
      setting_div,
      stim_show_time_input_id,
      ["form-label"],
      "Display time (ms):",
    );

    const stim_show_time_input = createNumInput(
      stim_show_time_input_id,
      setting_div,
      ["form-input"],
      1,
      30000,
      1,
      start_config.show_time_ms,
    );
    stim_show_time_input.setAttribute(
      "style",
      "width:4.5em;margin-right: 10px;margin-left:5px;",
    );
    stim_show_time_input.onchange = (event: Event) => {
      if (event.target) {
        if ("value" in event.target) {
          if (typeof event.target.value === "number") {
            info.show_time_ms = event.target.value;
          } else if (typeof event.target.value === "string") {
            info.show_time_ms = parseFloat(event.target.value);
          }
        }
      }
    };

    const stims_div = createDiv(`Vis-stim-${id_num}-stims`, stim_row_div, [
      "stims",
      "xscroll",
    ]);

    for (let i = 0; i < files_arr.length; i++) {
      const img_card_id = `${id_num}-${i}`;
      const card = createDiv(`img-card-${img_card_id}`, stims_div, [
        "card",
        "width_12vw",
      ]);
      const header = createDiv(`img-card-header-${img_card_id}`, card, [
        "card-header",
      ]);
      const header_content = createDiv(
        `img-card-header-content-${img_card_id}`,
        header,
        ["card-title", "h6"],
        files_arr[i].name,
      );
      const card_img = createDiv(`img-card-img-${img_card_id}`, card, [
        "card-image",
        "center",
      ]);
      const reader = new FileReader();
      reader.readAsDataURL(files_arr[i]);
      reader.onload = async (e: any) => {
        const img = document.createElement("img");
        img.setAttribute("src", e.target?.result);
        img.classList.add("fit");
        card_img.appendChild(img);
        const imageUrl = e.target?.result as string;
        if (imageUrl) {
          info.stim_info.push({
            sprite: await createSprite(imageUrl),
            file: files_arr[i],
          });
        }
      };
    }
    if (play_stim_button.disabled) {
      play_stim_button.disabled = false;
    }
    if (shuffle_within_input.disabled) {
      shuffle_within_input.disabled = false;
    }
    if (stim_info_list.length > 1 && shuffle_between_input.disabled) {
      shuffle_between_input.disabled = false;
    }
    if (show_progress_input.disabled) {
      show_progress_input.disabled = false;
    }
  }
}

function generateStimSeq(
  infos: StimulusSetInfo[],
  shuffle_within = true,
  shuffle_between = true,
) {
  let stim_seq: number[][] = [];
  let stim_seqs: number[][][] = [];
  let stim_set_repeat_left: number[] = infos.map((e) => e.num_repeat);
  while (any(stim_set_repeat_left)) {
    for (let set_i = 0; set_i < infos.length; set_i++) {
      if (stim_set_repeat_left[set_i] > 0) {
        const info = infos[set_i];
        stim_set_repeat_left[set_i] -= 1;
        const set_seq: number[][] = [];
        for (let stim_i = 0; stim_i < info.stim_info.length; stim_i++) {
          set_seq.push([set_i, stim_i]);
        }
        if (shuffle_within) {
          shuffle(set_seq, true);
        }
        stim_seqs.push(set_seq);
      }
    }
  }
  stim_seq = stim_seq.concat(...stim_seqs);
  if (shuffle_between) {
    shuffle(stim_seq, true);
  }
  return stim_seq;
}

function showPixiText(
  txt: string,
  text_style: PIXI.TextStyle = pixi_large_text,
) {
  let pre_baseline_text = new PIXI.Text({ text: txt, style: text_style });
  pre_baseline_text.anchor.set(0.5);
  pre_baseline_text.x = app.screen.width / 2;
  pre_baseline_text.y = app.screen.height / 2;
  app.stage.addChild(pre_baseline_text);
  return pre_baseline_text;
}

async function createSprite(imageUrl: string) {
  // const texture = PIXI.Texture.from(imageUrl);
  const texture = await PIXI.Assets.load(imageUrl);
  const sprite = new PIXI.Sprite(texture);
  sprite.anchor.set(0.5);
  sprite.x = app.screen.width / 2;
  sprite.y = app.screen.height / 2;
  return sprite;
}

function createLabel(
  id: string,
  parent: HTMLElement | undefined = undefined,
  for_id: string,
  classList: string[] = [],
  textContent: string = "",
) {
  const myLabel = document.createElement("label");
  configureHTMLElement(myLabel, id, parent, classList, textContent);
  myLabel.setAttribute("for", for_id);
  myLabel.setAttribute("style", "white-space: pre-wrap;");
  return myLabel;
}

function createNumInput(
  id: string,
  parent: HTMLElement | undefined = undefined,
  classList: string[] = [],
  min: number = 0,
  max: number = 100,
  step: number = 1,
  val: number = 1,
  textContent: string = "",
) {
  const myNumInput = document.createElement("input");
  configureHTMLElement(myNumInput, id, parent, [...classList], textContent);
  myNumInput.setAttribute("type", "number");
  myNumInput.setAttribute("min", min.toString());
  myNumInput.setAttribute("max", max.toString());
  myNumInput.setAttribute("step", step.toString());
  myNumInput.setAttribute("value", val.toString());
  return myNumInput;
}

function configureHTMLElement(
  e: HTMLElement,
  id: string,
  parent: HTMLElement | undefined = undefined,
  classList: string[] = [],
  textContent: string = "",
) {
  if (parent) {
    parent.appendChild(e);
  }
  if (classList.length > 0) {
    e.classList.add(...classList);
  }
  if (textContent.length > 0) {
    e.textContent = textContent;
  }
  e.id = id;
  return e;
}

function createDiv(
  id: string,
  parent: HTMLElement | undefined = undefined,
  classList: string[] = [],
  textContent: string = "",
) {
  const myDiv = document.createElement("div");
  configureHTMLElement(myDiv, id, parent, classList, textContent);
  return myDiv;
}

function createSwitch(labeltext: string, eventHandler: (ev: Event) => void) {
  const label = document.createElement("label");
  label.setAttribute("class", "form-switch");
  label.classList.add("label-lg");
  const input = document.createElement("input");
  input.id = `${labeltext}-onoff`;
  input.type = "checkbox";
  input.addEventListener("change", eventHandler);
  input.classList.add("input-lg");
  const icon = document.createElement("i");
  icon.classList.add("form-icon");
  label.textContent = labeltext;
  label.appendChild(input);
  label.appendChild(icon);
  return label;
}

function ws_connect() {
  socket = new WebSocket(WS_URL);

  socket.addEventListener("open", (event) => {
    console.log(`ws to ${WS_URL} connected!`);
    reconnect_count = 0;
  });

  socket.addEventListener("close", (event) => {
    console.log(
      `ws to ${WS_URL} disconnected! ${reconnect_count}/${MAX_RECONNECT}`,
    );
    if (reconnect_count < MAX_RECONNECT) {
      reconnect_timeout = setTimeout(ws_connect, 2000);
    }
  });

  socket.onerror = (err) => {
    reconnect_count++;
  };

  socket.addEventListener("message", (event) => {
    if (event.data === "Another instance is connected!") {
      reconnect_count = MAX_RECONNECT;
      window.alert(
        "Another instance is connected! Refresh page to take control if you must",
      );
    }
  });
}

setTimeout(ws_connect, 0);
