import inquirer, { Answers, Separator } from "inquirer";
import Choice from "inquirer/lib/objects/choice";
import { Key } from "readline";
import { renderer } from "./CheckboxRenderer";
import {
  CheckboxAnswers,
  CheckboxPrompt,
  KeyHandler,
  PointerDirection,
} from "./index";

inquirer.registerPrompt("test", CheckboxPrompt);

function onUpKey(this: CheckboxPrompt) {
  this.updatePointer(PointerDirection.Up);
  this.render();
}

function onDownKey(this: CheckboxPrompt) {
  this.updatePointer(PointerDirection.Down);
  this.render();
}

function onSpaceKey(this: CheckboxPrompt) {
  const currentValueShort =
    this.answers[this.keys.getChoice(this.pointer[1]).short];
  const currentValue = this.values.find(
    (choice) => choice.type === "choice" && choice.short == currentValueShort
  );
  const currentValueIndex = this.values.indexOf(currentValue);
  const newValue = this.values.getChoice((currentValueIndex + 1) % 2);
  this.assignValueToKey(this.pointer[1], this.values.indexOf(newValue as Choice));
  this.render();
}

const controls: { key: Key; handler: KeyHandler }[] = [
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

inquirer.prompt<CheckboxAnswers>([
  {
    type: "test",
    name: "hi",
    style: "radio",
    keys: [
      { displayName: "value1", id: "1" },
      { displayName: "value2", id: "2" },
    ],
    values: [
      { displayName: null, id: "checked" },
      { displayName: null, id: "unchecked" },
    ],
    controls,
    renderer: renderer,
  },
]);
