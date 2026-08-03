const ESC = "\u001B";
const COLOR = process.stdout.isTTY === true && process.env.NO_COLOR === undefined;

const paint = (code: string, value: string) => (COLOR ? `${ESC}[${code}m${value}${ESC}[0m` : value);

export const logger = {
  info: (message: string) => console.log(message),
  step: (message: string) => console.log(`${paint("36", "-")} ${message}`),
  success: (message: string) => console.log(`${paint("32", "✓")} ${message}`),
  warn: (message: string) => console.warn(`${paint("33", "!")} ${message}`),
  error: (message: string) => console.error(`${paint("31", "✗")} ${message}`),
  dim: (message: string) => console.log(paint("2", message)),
  break: () => console.log(""),
};
