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

function onLeftKey(this: CustomizablePrompt) {
  this.updatePointer(PointerDirection.Left);
  this.render();
}

function onRightKey(this: CustomizablePrompt) {
  this.updatePointer(PointerDirection.Right);
  this.render();
}

function onSpaceKey(this: CustomizablePrompt) {
  this.assignValueToKey(this.pointer[1], this.pointer[0]);
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
      sequence: "\u001b[C",
      name: "right",
      ctrl: false,
      meta: false,
      shift: false,
    },
    handler: onRightKey,
  },
  {
    key: {
      sequence: "\u001b[D",
      name: "left",
      ctrl: false,
      meta: false,
      shift: false,
    },
    handler: onLeftKey,
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
