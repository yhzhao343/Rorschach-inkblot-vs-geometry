import { startConfigFromUrl, prepVisStimCtrlPanel } from "./vis_stim_manager";

await prepVisStimCtrlPanel(startConfigFromUrl());

function location_reload() {
  location.reload();
  console.log("Page reloaded");
}
if (!(window as any).IS_PRODUCTION) {
  new EventSource("/esbuild").addEventListener("change", location_reload);
}
