import type {
  CustomizablePrompt,
  CustomizablePromptAnswers,
} from "../../src/customizablePrompt";

import Choice from "inquirer/lib/objects/choice";
import chalk, { Chalk } from "chalk";

export function renderer(this: CustomizablePrompt, error: string) {
  let message = this.getQuestion();
  let bottomContent = "";
  const choicesStr = renderChoices.call(this, this.pointer);

  message += "\n" + this.paginator.paginate(choicesStr, this.pointer[1]);

  if (error) {
    bottomContent = chalk.red(">> ") + error;
  }

  this.screen.render(message, bottomContent);
}

function renderChoices(this: CustomizablePrompt, pointer: [number, number]) {
  let output = "";
  let separatorOffset = 0;
  this.keys.forEach((choice, i) => {
    if (choice.type === "separator") {
      separatorOffset++;
      output += ` ${choice}\n`;
      return;
    }
    if (choice.disabled) {
      //todo
    } else {
      const isCurrentLine = i - separatorOffset === pointer[1];
      output +=
        " " +
        choice.name.padEnd(14, " ") +
        "\t" +
        getRenderedValues.call(
          this,
          this.answers[choice.short],
          pointer[0],
          isCurrentLine
        ) +
        "\n";
    }
  });

  return output.replace(/\n$/, "");
}

function getRenderedValues(
  this: CustomizablePrompt,
  currentValue: string,
  xPointer: number,
  isCurrentLine: boolean
) {
  let renderedValues = "";
  let separatorOffset = 0;
  this.values.choices.forEach((choice, i) => {
    if (choice.type === "separator") {
      separatorOffset++;
      renderedValues += ` ${choice}`;
      return;
    }
    const isSelected = i - xPointer - separatorOffset === 0 && isCurrentLine;
    const isCurrentValue = choice.short === currentValue;

    renderedValues +=
      " " + getRenderedValue.call(this, isCurrentValue, isSelected, choice);
  });
  return renderedValues;
}

function getRenderedValue(
  this: CustomizablePrompt,
  isCurrentValue: boolean,
  isSelected: boolean,
  choice: Choice<CustomizablePromptAnswers>
) {
  let chalker: Chalk = chalk;
  if (isCurrentValue) {
    chalker = chalker.underline;
  }
  if (isSelected) {
    chalker = chalker.inverse;
  }
  return chalker(choice.name);
}
