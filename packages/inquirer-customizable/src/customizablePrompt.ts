import { Question, Answers } from "inquirer";
import Base from "inquirer/lib/prompts/base";
import { Interface, Key } from "readline";
import { KeyPressEventManager } from "./keypressManager";
import cliCursor from "cli-cursor";
import Paginator from "inquirer/lib/utils/paginator";
import { map } from "rxjs/operators";
import Choices from "inquirer/lib/objects/choices";
import debounce from "lodash.debounce";
import Choice from "inquirer/lib/objects/choice";
import Separator from "inquirer/lib/objects/separator";

//#region types

export enum PointerDirection {
  Up,
  Down,
  Left,
  Right,
}

export type KeyHandler = (this: CustomizablePrompt) => void;

export type CustomizablePromptDimensionOption = ArrayOrAsyncSearchableOf<
  CustomizablePromptDimension | Separator,
  CustomizablePromptQuestion,
  CustomizablePrompt
>;
export interface CustomizablePromptAnswers extends Answers {
  key: string;
  value: string;
}

export interface CustomizablePromptDimension extends Answers {
  displayName: string;
  id: string;
}

interface CustomizablePromptQuestion extends Question<Answers> {
  keys: ArrayOrAsyncSearchableOf<
    CustomizablePromptDimension,
    CustomizablePromptQuestion,
    CustomizablePrompt
  >;
  values: ArrayOrAsyncSearchableOf<
    CustomizablePromptDimension,
    CustomizablePromptQuestion,
    CustomizablePrompt
  >;
  renderer: (this: CustomizablePrompt, error: string) => void;
  defaults: Record<string, string>;
  disabled: Record<string, string[]>;
  controls: [{ key: string | Key; hint?: string; handler: KeyHandler }];
  shouldLoop?: boolean;
  pageSize?: number;
}

type ArrayOrAsyncSearchableOf<
  TReturn,
  TQuestion,
  TPrompt extends Base<TQuestion>
> =
  | Array<TReturn>
  | ((this: TPrompt, searchTerm: string) => Promise<TReturn[]>);

//#endregion

export class CustomizablePrompt extends Base<CustomizablePromptQuestion> {
  private static readonly DimensionNames = ["keys", "values"] as const;
  static defaultOptions: Partial<typeof CustomizablePrompt.prototype.opt> = {};
  private done: (callback: any) => void;
  public paginator: Paginator;
  public keys: Choices;
  public values: Choices;
  private readonly disabled: Record<string, string[]>;
  //TODO: move to {x:number,y:number}, tuple is stupid because it's not obvious what dimension is what.
  private _pointer: [number, number];
  public get pointer(): [number, number] {
    return [...this._pointer];
  }
  private keyPressEventManager: KeyPressEventManager;
  protected render: (error?: string) => void;

  public constructor(
    question: CustomizablePromptQuestion,
    rl: Interface,
    answers: CustomizablePromptAnswers | Answers
  ) {
    super(question, rl, answers);
    this.checkOptions();
    this._pointer = [0, 0];
    this.keyPressEventManager = new KeyPressEventManager(rl);

    this.paginator = new Paginator(this.screen);
    this.answers = { ...this.opt.default };
    this.disabled = { ...this.opt.disabled };
    this.setDimensions();
    this.render = this.opt.renderer.bind(this);
  }

  private setDimensions() {
    for (const dimensionName of CustomizablePrompt.DimensionNames) {
      this.setDimension(dimensionName);
    }
  }

  protected isKeyValuePairDisabled(keyId: string, valueId: string) {
    return this.disabled[keyId]?.includes(valueId);
  }

  protected assignValueToKey(keyIndex: number, valueIndex: number): boolean {
    const key = this.keys.get(keyIndex);
    const value = this.values.get(valueIndex);
    if (key.type === "choice" && value.type === "choice") {
      if (this.isKeyValuePairDisabled(key.short, value.short)) {
        return false;
      }
      this.answers[key.short] = value.short;
      return true;
    }
  }

  private setDimension(
    dimension: typeof CustomizablePrompt.DimensionNames[number]
  ) {
    const option: CustomizablePromptDimensionOption = this.opt[dimension];
    let dimensions: (Separator | CustomizablePromptDimension)[];
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
    T extends CustomizablePromptDimension = CustomizablePromptDimension
  >(dimension: T | Separator): Choice<T> | Separator {
    return dimension instanceof Separator
      ? dimension
      : {
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
      CustomizablePrompt.DimensionNames.some(
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
        for (const dimension of CustomizablePrompt.DimensionNames) {
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
    let increment = 0;
    switch (direction) {
      case PointerDirection.Down:
        maxBoundary = this.keys.realLength;
        dimensionIndex = +1;
        increment = +1;
        break;
      case PointerDirection.Up:
        maxBoundary = this.keys.realLength;
        dimensionIndex = 1;
        increment = -1;
        break;
      case PointerDirection.Left:
        maxBoundary = this.values.realLength;
        dimensionIndex = 0;
        increment = -1;
        break;
      case PointerDirection.Right:
        maxBoundary = this.values.realLength;
        dimensionIndex = 0;
        increment = +1;
        break;
    }

    const attemptIndex = this._pointer[dimensionIndex] + increment;
    if (attemptIndex > -1 && attemptIndex < maxBoundary) {
      this._pointer[dimensionIndex] = attemptIndex;
    }
  }
}
