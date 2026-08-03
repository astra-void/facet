import { createInterface, type Interface } from "node:readline/promises";

export type Choice<T extends string> = {
  value: T;
  label: string;
};

/**
 * Minimal prompting over `readline`. No dependency, no alternate screen buffer,
 * no spinner — `init` asks five questions once.
 *
 * When `auto` is set (`--yes`, or stdin is not a TTY, which is how CI and
 * `npx facet init < /dev/null` behave) every prompt resolves to its default
 * without printing. A CLI that blocks forever on a hidden question is worse
 * than one that picks the documented default.
 */
export class Prompter {
  private rl: Interface | undefined;

  constructor(private readonly auto: boolean) {}

  private get input(): Interface {
    if (this.rl === undefined) {
      this.rl = createInterface({ input: process.stdin, output: process.stdout });
    }
    return this.rl;
  }

  async text(message: string, defaultValue: string): Promise<string> {
    if (this.auto) {
      return defaultValue;
    }
    const answer = (await this.input.question(`  ${message} (${defaultValue}) `)).trim();
    return answer === "" ? defaultValue : answer;
  }

  async select<T extends string>(message: string, choices: Choice<T>[], defaultValue: T): Promise<T> {
    if (this.auto) {
      return defaultValue;
    }

    const labels = choices.map((choice) => choice.value).join("/");
    for (;;) {
      const answer = (await this.input.question(`  ${message} [${labels}] (${defaultValue}) `)).trim();
      if (answer === "") {
        return defaultValue;
      }
      const match = choices.find((choice) => choice.value === answer);
      if (match !== undefined) {
        return match.value;
      }
      console.log(`  Not one of ${labels}.`);
    }
  }

  async confirm(message: string, defaultValue: boolean): Promise<boolean> {
    if (this.auto) {
      return defaultValue;
    }
    const hint = defaultValue ? "Y/n" : "y/N";
    const answer = (await this.input.question(`  ${message} (${hint}) `)).trim().toLowerCase();
    if (answer === "") {
      return defaultValue;
    }
    return answer === "y" || answer === "yes";
  }

  close(): void {
    this.rl?.close();
    this.rl = undefined;
  }
}

export function createPrompter(yes: boolean): Prompter {
  return new Prompter(yes || !process.stdin.isTTY);
}
