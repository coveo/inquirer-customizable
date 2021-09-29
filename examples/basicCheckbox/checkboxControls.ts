import Choice from "inquirer/lib/objects/choice";
import type { Key } from "readline";
import {
  CustomizablePrompt,
  PointerDirection,
  KeyHandler,
} from "../../src/customizablePrompt";

function onUpKey(this: CustomizablePrompt) {
  this.updatePointer(PointerDirection.Up);
  this.render();
}

function onDownKey(this: CustomizablePrompt) {
  this.updatePointer(PointerDirection.Down);
  this.render();
}

function onSpaceKey(this: CustomizablePrompt) {
  const currentValueShort =
    this.answers[this.keys.getChoice(this.pointer[1]).short];
  const currentValue = this.values.find(
    (choice) => choice.type === "choice" && choice.short == currentValueShort
  );
  const currentValueIndex = this.values.indexOf(currentValue);
  const newValue = this.values.getChoice((currentValueIndex + 1) % 2);
  this.assignValueToKey(
    this.pointer[1],
    this.values.indexOf(newValue as Choice)
  );
  this.render();
}

export const checkboxControls: { key: Key; handler: KeyHandler }[] = [
  {
    key: {
      sequence: "\u001b[A",
      name: "up",
      ctrl: false,
      meta: false,
      shift: false,
    },
    handler: onUpKey,
  },
  {
    key: {
      sequence: "\u001b[B",
      name: "down",
      ctrl: false,
      meta: false,
      shift: false,
    },
    handler: onDownKey,
  },
  {
    key: {
      sequence: " ",
      name: "space",
      ctrl: false,
      meta: false,
      shift: false,
    },
    handler: onSpaceKey,
  },
];
