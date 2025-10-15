import * as PIXI from 'pixi.js';

export function openFullscreen() {
  let elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if ((elem as any).webkitRequestFullscreen) {
    /* Safari */
    (elem as any).webkitRequestFullscreen();
  } else if ((elem as any).msRequestFullscreen) {
    /* IE11 */
    (elem as any).msRequestFullscreen();
  }
}

export function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if ((document as any).webkitExitFullscreen) {
    /* Safari */
    (document as any).webkitExitFullscreen();
  } else if ((document as any).msExitFullscreen) {
    /* IE11 */
    (document as any).msExitFullscreen();
  }
}

export const pixi_large_text = new PIXI.TextStyle({
  fontFamily: 'Arial',
  fontSize: 64,
  fill: 0x000000, // White color
  align: 'center'
});

export const pixi_huge_text = new PIXI.TextStyle({
  fontFamily: 'Arial',
  fontSize: 86,
  fill: 0x000000, // White color
  align: 'center'
});

export function delay(time_ms: number, callback: Function | null = null) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
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

export function delay_ms(time_ms: number) {
  return () => delay(time_ms)
}

export function linspace(
  start: number,
  stop: number,
  num: number = 50,
  endpoint: boolean = true,
): Array<number> {
  num = Math.round(num);
  let delta = 0;
  if (endpoint) {
    delta = (stop - start) / (num - 1);
  } else {
    delta = (stop - start) / num;
  }
  let result = new Array<number>(num);
  result[0] = start;
  for (let i = 1; i < num; i++) {
    result[i] = result[i - 1] + delta;
  }
  return result;
}

export function arange(
  start: number = 0,
  stop: number = 10,
  step: number = 1,
): Array<number> {
  const size = Math.floor((stop - start) / step);
  let result = new Array<number>(size);
  result[0] = start;
  for (let i = 1; i < size; i++) {
    result[i] = result[i - 1] + step;
  }
  return result;
}

export function shuffle(arr_in: any[], inplace: boolean = false) {
  let arr: any[];
  if (inplace) {
    arr = arr_in;
  } else {
    arr = JSON.parse(JSON.stringify(arr_in));
  }
  for (let i = arr.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

export function any(arr: number[]) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > 0) {
      return true
    }
  }
  return false
}

export function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

export function epochTimestamp() {
  return performance.timeOrigin + performance.now()
}

export function download(
  filename: string,
  content: string,
  mimeType: string = "application/json",
) {
  const a = document.createElement("a");
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  a.setAttribute("href", url);
  a.setAttribute("download", filename);
  a.click();
}