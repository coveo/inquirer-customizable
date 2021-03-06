import type { CustomizablePrompt } from "../../src/customizablePrompt";

import chalk from "chalk";
import figures from "figures";

export function renderer(this: CustomizablePrompt, error: string) {
  let message = this.getQuestion();
  let bottomContent = "";

  const choicesStr = renderChoices.call(this, this.pointer[1]);

  message += "\n" + this.paginator.paginate(choicesStr, this.pointer[1]);

  if (error) {
    bottomContent = chalk.red(">> ") + error;
  }

  this.screen.render(message, bottomContent);
}

function renderChoices(this: CustomizablePrompt, pointer: number) {
  let output = "";
  let separatorOffset = 0;
  this.keys.forEach((choice, i) => {
    if (choice.type === "separator") {
      separatorOffset++;
      output += ` ${choice}\n`;
      return;
    }
    if (choice.disabled) {
      separatorOffset++;
      output += ` - ${choice.name}`;
      output += ` (${
        typeof choice.disabled === "string" ? choice.disabled : "Disabled"
      })`;
    } else {
      const line = `${getCheckbox.call(this, this.answers[choice.short])} ${
        choice.name
      }`;
      if (i - separatorOffset === pointer) {
        output += chalk.cyan(figures.pointer + line);
      } else {
        output += ` ${line}`;
      }
    }

    output += "\n";
  });

  return output.replace(/\n$/, "");
}

function getCheckbox(this: CustomizablePrompt, value: string) {
  return value == "checked" ? chalk.green(figures.radioOn) : figures.radioOff;
}
