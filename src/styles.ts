export const input_style = {
  "font-size": "1.6em",
  "margin-right": "20px",
  height: "5vh",
  "font-family": "Arial, sans-serif",
};

export const label_style = {
  "font-size": "1.6em",
  "font-family": "Arial, sans-serif",
  "margin-right": "6px",
};

export function objToStyleStr(obj: Object) {
  const str_list: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    str_list.push(`${key}:${value};`);
  }
  return str_list.join("");
}
