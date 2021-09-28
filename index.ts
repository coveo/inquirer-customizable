import inquirer, {
  Question,
  Answers,
  BaseChoiceMap,
  DistinctChoice,
  ChoiceOptions,
} from "inquirer";
import Base from "inquirer/lib/prompts/base";
import { Interface, Key } from "readline";
import { KeyPressEventManager } from "./KeypressManager";
import cliCursor from "cli-cursor";
import Paginator from "inquirer/lib/utils/paginator";
import { map } from "rxjs/operators";
import Choices from "inquirer/lib/objects/choices";
import debounce from "lodash.debounce";
import Choice from "inquirer/lib/objects/choice";
import Separator from "inquirer/lib/objects/separator";

//#region types

export enum PointerDirection {
  Up = -1,
  Down = +1,
  Left = -1,
  Right = +1,
}

export type KeyHandler = (this: CheckboxPrompt) => void;

export interface CheckboxAnswers extends Answers {
  key: string;
  value: string;
}

export interface CheckboxDimension extends Answers {
  displayName: string;
  id: string;
}

interface CheckboxPromptQuestion extends Question<CheckboxAnswers> {
  keys: ArrayOrAsyncSearchableOf<CheckboxDimension, CheckboxPrompt>;
  values: ArrayOrAsyncSearchableOf<CheckboxDimension, CheckboxPrompt>;
  renderer: (this: CheckboxPrompt, error: string) => void;
  defaults: { [key: string]: CheckboxDimension };
  controls: [{ key: string | Key; hint?: string; handler: KeyHandler }];
  shouldLoop?: boolean;
  pageSize?: number;
}

type ArrayOrAsyncSearchableOf<TReturn, TPrompt extends Base> =
  | Array<TReturn>
  | ((this: TPrompt, searchTerm: string) => Promise<TReturn[]>);

//#endregion

export class CheckboxPrompt extends Base<CheckboxPromptQuestion> {
  private static readonly DimensionNames = ["keys", "values"] as const;
  static defaultOptions: Partial<typeof CheckboxPrompt.prototype.opt> = {};
  private done: (callback: any) => void;
  public paginator: Paginator;
  public keys: Choices;
  public values: Choices;
  //TODO: move to {x:number,y:number}, tuple is stupid because it's not obvious what dimension is what.
  private _pointer: [number, number];
  public get pointer(): [number, number] {
    return [...this._pointer];
  }
  private keyPressEventManager: KeyPressEventManager;

  protected render: (error?: string) => void;

  public constructor(
    question: CheckboxPromptQuestion,
    rl: Interface,
    answers: CheckboxAnswers
  ) {
    super(question, rl, answers);
    this.checkOptions();
    this._pointer = [0, 0];
    this.keyPressEventManager = new KeyPressEventManager(rl);

    this.paginator = new Paginator(this.screen);
    this.answers = {};
    this.setDimensions();
    this.render = this.opt.renderer.bind(this);
  }

  private setDimensions() {
    for (const dimensionName of CheckboxPrompt.DimensionNames) {
      this.setDimension(dimensionName);
    }
  }

  protected assignValueToKey(keyIndex: number, valueIndex: number) {
    const key = this.keys.get(keyIndex);
    const value = this.values.get(valueIndex);
    if (key.type === "choice" && value.type === "choice") {
      this.answers[key.short] = value.short;
    }
  }

  private setDimension(
    dimension: typeof CheckboxPrompt.DimensionNames[number]
  ) {
    const option = this.opt[dimension];
    let dimensions;
    if (Array.isArray(option)) {
      dimensions = option;
    } else {
      dimensions = [];
      option.bind(this)("").then(/*todo*/);
    }
    this[dimension] = new Choices<Answers>(
      dimensions.map(this.transformDimensionToChoice),
      {}
    );
  }

  public transformDimensionToChoice<
    T extends CheckboxDimension = CheckboxDimension
  >(dimension: T): Choice<T> {
    return {
      name: dimension.displayName,
      short: dimension.id,
      value: null,
      disabled: false,
      type: "choice",
    };
  }

  _run(cb: (callback: any) => void) {
    this.done = cb;
    this.registerCustomKeyHandlers();
    this.registerValidationHandlers();
    this.registerDefaultHandler();
    cliCursor.hide();
    this.render();
    return this;
  }

  private registerDefaultHandler() {
    if (
      CheckboxPrompt.DimensionNames.some(
        (dimension) => !Array.isArray(this.opt[dimension])
      )
    ) {
      return;
    }
    this.keyPressEventManager.registerDefaultKeyHandler(
      this.defaultKeyHandler()
    );
  }

  private defaultKeyHandler() {
    return debounce(
      (() => {
        for (const dimension of CheckboxPrompt.DimensionNames) {
          const option = this.opt[dimension];
          if (Array.isArray(option)) {
            continue;
          } else {
            option.call(this, this.rl.line);
          }
        }
      }).bind(this)
    );
  }

  private registerValidationHandlers() {
    const validation = this.handleSubmitEvents(
      this.keyPressEventManager.line.pipe(map(this.getCurrentValue.bind(this)))
    );
    validation.success.forEach(this.onEnd.bind(this));
    validation.error.forEach(this.onError.bind(this));
  }

  getCurrentValue() {
    return Array.from(Object.entries(this.answers));
  }

  private checkOptions() {
    if (!this.isOptKeyValid()) {
      this.throwParamError("keys");
    }
    if (!Array.isArray(this.opt.values) || this.opt.values.length < 2) {
      this.throwParamError("values");
    }
  }

  private isOptKeyValid() {
    return (
      typeof this.opt.keys === "function" ||
      (Array.isArray(this.opt.keys) && this.opt.keys.length > 0)
    );
  }

  private registerCustomKeyHandlers() {
    for (const { key, handler } of this.opt.controls) {
      this.keyPressEventManager.registerKeyHandler(key, handler.bind(this));
    }
  }

  onEnd(state) {
    this.status = "answered";
    // Rerender prompt (and clean subline error)
    this.render();

    this.screen.done();
    cliCursor.show();
    this.done(state.value);
  }

  onError(state) {
    this.render(state.isValid);
  }

  updatePointer(direction: PointerDirection): void {
    let maxBoundary = 0;
    let dimensionIndex = -1;
    switch (direction) {
      case PointerDirection.Down:
      case PointerDirection.Up:
        maxBoundary = this.values.length;
        dimensionIndex = 1;
        break;
      case PointerDirection.Left:
      case PointerDirection.Right:
        maxBoundary = this.keys.length;
        dimensionIndex = 0;
        break;
    }

    const attemptIndex = this._pointer[dimensionIndex] + direction;
    if (attemptIndex > -1 && attemptIndex < maxBoundary) {
      this._pointer[dimensionIndex] = attemptIndex;
    }
  }

  // private showHint() {
  //   this.shouldPrintHint = true;
  // }
  // private hideHint() {
  //   this.shouldPrintHint = false;
  // }
}
// const renderer = function (this: CheckboxPrompt, error: string) {
//   let message = this.getQuestion();
//   let bottomContent = "";
//   if (this.shouldPrintHint) {
//     message += this.getHintMessage();
//   }

//   const choicesStr = renderChoices(this.currentKeys, this.pointer);

//   message += "\n" + this.paginator.paginate(choicesStr, this.pointer);

//   if (error) {
//     bottomContent = chalk.red(">> ") + error;
//   }

//   this.screen.render(message, bottomContent);
// };

// function renderChoices(choices: CheckboxKeys[], pointer: number) {
//   let output = "";
//   let separatorOffset = 0;

//   choices.forEach((choice, i) => {
//     const line = getCheckbox(choice.value) + " " + choice.displayName;
//     if (i - separatorOffset === pointer) {
//       output += chalk.cyan(figures.pointer + line);
//     } else {
//       output += " " + line;
//     }

//     output += "\n";
//   });

//   return output.replace(/\n$/, "");
// }

// function getCheckbox(checked: string) {
//   return checked == TwoState.Positive
//     ? chalk.green(figures.radioOn)
//     : figures.radioOff;
// }
