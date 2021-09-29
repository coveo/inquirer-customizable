import inquirer from "inquirer";
import { renderer } from "./checkboxRenderer";
import { checkboxControls } from "./checkboxControls";
import {
  CheckboxAnswers,
  CustomizablePrompt,
} from "../../src/customizablePrompt";

inquirer.registerPrompt("test", CustomizablePrompt);

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
    checkboxControls,
    renderer: renderer,
  },
]);
