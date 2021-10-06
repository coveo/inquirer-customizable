import type {
  CustomizablePrompt,
  CustomizablePromptAnswers,
} from "../../src/customizablePrompt";

import Choice from "inquirer/lib/objects/choice";
import chalk, { Chalk } from "chalk";
import stripAnsi from "strip-ansi";

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
    const isCurrentLine = i - separatorOffset === pointer[1];
    output +=
      " " +
      choice.name.padEnd(14, " ") +
      "\t" +
      getRenderedValues.call(
        this,
        choice.short,
        pointer,
        isCurrentLine,
        choice.disabled
      ) +
      "\n";
  });

  return output.replace(/\n$/, "");
}

function getRenderedValues(
  this: CustomizablePrompt,
  key: string,
  pointer: [number, number],
  isCurrentLine: boolean,
  isLineDisabled: boolean
) {
  let renderedValues = "";
  let separatorOffset = 0;
  this.values.forEach((choice, i) => {
    if (choice.type === "separator") {
      separatorOffset++;
      renderedValues += ` ${choice}`;
      return;
    }

    const isValueDisabled =
      isLineDisabled ||
      choice.disabled ||
      this.isKeyValuePairDisabled(key, choice.short);
    const isSelected = i - pointer[0] - separatorOffset === 0 && isCurrentLine;
    const isCurrentValue = choice.short === this.answers[key];
    renderedValues +=
      " " +
      getRenderedValue.call(
        this,
        isCurrentValue,
        isSelected,
        isValueDisabled,
        choice
      );
  });
  return renderedValues;
}

function getRenderedValue(
  this: CustomizablePrompt,
  isCurrentValue: boolean,
  isSelected: boolean,
  isDisabled: boolean,
  choice: Choice<CustomizablePromptAnswers>
) {
  let chalker: Chalk = chalk;
  let name = choice.name;
  if (isCurrentValue) {
    chalker = chalker.underline;
  }
  if (isSelected) {
    chalker = chalker.inverse;
  }
  if (isDisabled) {
    chalker = chalker.gray;
    name = stripAnsi(name);
  }
  return chalker(name);
}
