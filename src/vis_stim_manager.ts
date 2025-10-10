import { VisStimConfig } from "./interfaces";
import { input_style, label_style, objToStyleStr } from "./styles";

const defaultConfig: VisStimConfig = {
  start_baseline_s: 180,
  start_fixation_ms: 1500,
  target_group_ms: 5000,
  ctrl_group_ms: 5000,
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

  const form = createDiv("form", control_panel_div, ["flat-form"]);
  control_panel_div.appendChild(form);

  // const baseline_form_group = createDiv("baseline-form", form, ["form-group"]);

  const pre_baseline_input_id = "pre_baseline_time_s";
  const pre_baseline_label = createLabel(
    "pre_baseline_time_span",
    form,
    pre_baseline_input_id,
    [],
    "Pre Baseline(s):",
  );
  pre_baseline_label.setAttribute("style", objToStyleStr(label_style));

  const pre_baseline_input = createNumInput(
    pre_baseline_input_id,
    form,
    [],
    30,
    300,
    10,
    start_config.start_baseline_s,
  );
  pre_baseline_input.setAttribute(
    "style",
    objToStyleStr({ ...input_style, width: "3em" }),
  );

  const post_baseline_input_id = "baseline_time_s";
  const post_baseline_label = createLabel(
    "post_baseline_time_span",
    form,
    post_baseline_input_id,
    [],
    "Post Baseline(s):",
  );
  post_baseline_label.setAttribute("style", objToStyleStr(label_style));

  const post_baseline_input = createNumInput(
    post_baseline_input_id,
    form,
    [],
    30,
    300,
    10,
    start_config.start_baseline_s,
  );
  post_baseline_input.setAttribute(
    "style",
    objToStyleStr({ ...input_style, width: "3em" }),
  );
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
