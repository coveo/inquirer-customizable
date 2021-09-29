import type { Interface as ReadlineInterface, Key } from "readline";
import { Readable } from "stream";

import { fromEvent, Observable } from "rxjs";
import { filter, share, takeUntil } from "rxjs/operators";

interface ReadlineInterfaceExtended extends ReadlineInterface {
  input: Readable;
}

function normalizeKeypressEvents(value: string, key: Key = {}) {
  return { value, key: key || {} };
}

const letterAndNumbers = /^[a-zA-Z0-9]$/;
const isCapitalLetter = /^[A-Z]$/;

export class KeyPressEventManager {
  public keypress: Observable<{ value: string; key: Key }>;
  private listenedKeys: Set<Key>;
  line: Observable<unknown>;
  constructor(readlineInterface: ReadlineInterface) {
    this.keypress = this.buildKeyPress(
      readlineInterface as ReadlineInterfaceExtended
    );
    this.listenedKeys = new Set();
    this.line = fromEvent(readlineInterface, "line");
  }

  public registerKeyHandler(listenedKey: string | Key, keyHandler: () => void) {
    if (typeof listenedKey === "string") {
      if (letterAndNumbers.test(listenedKey)) {
        listenedKey = this.keyFromString(listenedKey);
      } else {
        console.warn(`Key '${listenedKey} should be defined as a Key object.`);
        return;
      }
    }
    this.listenedKeys.add(listenedKey);
    this.keypress
      .pipe(
        filter(({ key }) =>
          typeof listenedKey === "string"
            ? key.name === listenedKey
            : !Object.keys(listenedKey).some(
                (prop) => key[prop] !== listenedKey[prop]
              )
        ),
        share()
      )
      .forEach(keyHandler);
  }

  public registerDefaultKeyHandler(defaultHandler: () => void) {
    this.keypress
      .pipe(
        filter(({ key }) => !this.listenedKeys.has(key)),
        share()
      )
      .forEach(defaultHandler);
  }

  private buildKeyPress(readlineInterface: ReadlineInterfaceExtended) {
    return fromEvent(
      readlineInterface.input,
      "keypress",
      normalizeKeypressEvents
    ).pipe(takeUntil(fromEvent(readlineInterface, "close")));
  }

  private keyFromString(listenedKey: string): Key {
    return {
      ctrl: false,
      name: listenedKey.toLowerCase(),
      meta: false,
      shift: isCapitalLetter.test(listenedKey),
    };
  }
}
