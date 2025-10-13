import { VisStimConfig } from "./interfaces";
// import { input_style, label_style } from "./styles";

const defaultConfig: VisStimConfig = {
  start_baseline_s: 180,
  start_fixation_ms: 1500,
  num_repeat: 3,
  show_time_ms: 5000,
  end_white_ms: 1500,
  end_baseline_s: 180,
};

export function getDefaultStartConfig(): VisStimConfig {
  return { ...defaultConfig };
}

export function startConfigFromUrl() {
  const params: URLSearchParams = new URLSearchParams(window.location.search);
  // const start_config: VisStimConfig = getDefaultStartConfig();
  // const param_baseline_ms = params.get("baseline_ms")
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

export function prepVisStimCtrlPanel(
  start_config: VisStimConfig,
  parentElement?: HTMLElement,
) {
  updateSearchURL(start_config);

  const control_panel_div = document.createElement("div");
  control_panel_div.classList.add("control-panel-div");
  if (typeof parentElement === "undefined") {
    parentElement = document.createElement("div");
    document.body.appendChild(parentElement);
  }

  parentElement.appendChild(control_panel_div);

  const timing_form = createDiv("timing_form", control_panel_div, [
    "flat-form",
  ]);
  control_panel_div.appendChild(timing_form);


  const start_baseline_input_id = "start_baseline_time_s";
  const start_baseline_label = createLabel(
    "start_baseline_time_span",
    timing_form,
    start_baseline_input_id,
    ["xlg-label"],
    "Start Baseline(s):",
  );

  const start_baseline_input = createNumInput(
    start_baseline_input_id,
    timing_form,
    ["xlg-input"],
    30,
    300,
    1,
    start_config.start_baseline_s,
  );
  start_baseline_input.setAttribute("style", "width:3em");

  const end_baseline_input_id = "end_baseline_time_s";
  const end_baseline_label = createLabel(
    "end_baseline_time_span",
    timing_form,
    end_baseline_input_id,
    ["xlg-label"],
    "End Baseline(s):",
  );

  const end_baseline_input = createNumInput(
    end_baseline_input_id,
    timing_form,
    ["xlg-input"],
    30,
    300,
    1,
    start_config.start_baseline_s,
  );
  end_baseline_input.setAttribute("style", "width:3em");

  const start_fixation_input_id = "start_fixation_time_ms";
  const start_fixation_label = createLabel(
    "start_fixation_time_span",
    timing_form,
    start_fixation_input_id,
    ["xlg-label"],
    "Start Fixation (ms):",
  );

  const start_fixation_input = createNumInput(
    start_fixation_input_id,
    timing_form,
    ["xlg-input"],
    1000,
    10000,
    1,
    start_config.start_fixation_ms,
  );
  start_fixation_input.setAttribute("style", "width: 3.2em");

  const end_white_input_id = "end_white_time_ms";
  const end_white_label = createLabel(
    "end_white_time_span",
    timing_form,
    end_white_input_id,
    ["xlg-label"],
    "End White (ms):",
  );

  const end_white_input = createNumInput(
    end_white_input_id,
    timing_form,
    ["xlg-input"],
    1000,
    10000,
    1,
    start_config.end_white_ms,
  );
  end_white_input.setAttribute("style", "width: 3.2em");

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
  add_vis_stim_in.onchange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const files = target.files as FileList;
    if (files.length > 0) {
      addVisStimSet(files);
    }
  };

  const add_vis_sim_btn = document.createElement("button");
  add_vis_sim_btn.classList.add("xlf-button")

  add_vis_sim_btn.innerHTML = "+ Stim Set";
  timing_form.appendChild(add_vis_sim_btn);
  add_vis_sim_btn.onclick = () => {
    add_vis_stim_in.click();
  };

  const vis_stim = createDiv("vis_stim", control_panel_div, ["flat-flex-col"]);
  vis_stim.setAttribute("style", "width:100%");
  control_panel_div.appendChild(vis_stim);
  const file_lists: FileList[] = []

  function addVisStimSet(files: FileList) {
    file_lists.push(files);
    const files_arr = Array.from(files);
    files_arr.reverse();
    const id_num = vis_stim.children.length;
    const stim_row_div = createDiv(`Vis-stim-${id_num}`, vis_stim, [
      "vis-stim-row",
      "xscroll",
    ]);
    // const set_title = document.createElement("h5");
    // set_title.textContent = `Set ${id_num}: ${files.length} stimulus`;
    // stim_row_div.appendChild(set_title);
    const title_card = createDiv(`img-card-${id_num}`, stim_row_div, ["card", "card_12vw", "center"]);
    // title_card.setAttribute("style", "width:10vw");
    const title_header = createDiv(`img-card-header-${id_num}`, title_card, [
      "card-header",
    ]);
    const title_header_content = createDiv(
      `img-card-header-content-${id_num}`,
      title_header,
      ["card-title", "h6"],
      `Set ${id_num + 1}: ${files_arr.length} stimulus`,
    );

    const title_card_content = createDiv(`img-card-content-${id_num}`, title_card, [
      "card-image",
    ]);
    title_card_content.setAttribute("style", "display:flex;flex-direction: column;")

    const num_repeat_input_id = "num_repeat_time_s";
    const num_repeat_label = createLabel(
      "num_repeat_time_span",
      title_card_content,
      num_repeat_input_id,
      ["lg-label"],
      "# repeat each:",
    );


    const num_repeat_input = createNumInput(
      num_repeat_input_id,
      title_card_content,
      ["lg-input"],
      1,
      100,
      1,
      start_config.num_repeat,
    );
    num_repeat_input.setAttribute("style", "width:3em")


    const stim_show_time_input_id = "stim_show_time_time_s";
    const stim_show_time_label = createLabel(
      "stim_show_time_time_span",
      title_card_content,
      stim_show_time_input_id,
      ["lg-label"],
      "Display time (ms):",
    );


    const stim_show_time_input = createNumInput(
      stim_show_time_input_id,
      title_card_content,
      ["lg-input"],
      1,
      30000,
      1,
      start_config.show_time_ms,
    );
    stim_show_time_input.setAttribute("style", "width:4em")


    for (let i = 0; i < files_arr.length; i++) {
      const img_card_id = `${id_num}-${i}`;
      const card = createDiv(`img-card-${img_card_id}`, stim_row_div, ["card", "card_12vw"]);
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
      ]);
      const reader = new FileReader();
      reader.readAsDataURL(files_arr[i]);
      reader.onload = (e: any) => {
        const img = document.createElement("img");
        img.setAttribute("src", e.target?.result);
        img.classList.add("fit");
        card_img.appendChild(img);
      };
    }
  }

  // add_vis_stim_set.innerHTML = "+ Stim Set";
  // vis_stim.appendChild(add_vis_stim_set);
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
