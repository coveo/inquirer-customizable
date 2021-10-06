import inquirer from "inquirer";
import { renderer } from "./checkboxRenderer";
import { checkboxControls as controls } from "./checkboxControls";
import {
  CustomizablePromptAnswers,
  CustomizablePrompt,
} from "../../src/customizablePrompt";

inquirer.registerPrompt("test", CustomizablePrompt);

inquirer
  .prompt<CustomizablePromptAnswers>([
    {
      type: "test",
      name: "hi",
      style: "radio",
      keys: [
        { displayName: "value1", id: "myId_1" },
        { displayName: "value2", id: "myId_2" },
      ],
      values: [
        { displayName: null, id: "checked" },
        { displayName: null, id: "unchecked" },
      ],
      default: {
        myId_1: "checked",
      },
      controls,
      renderer: renderer,
    },
  ])
  .then((answers) =>
    console.log(`Prompt session complete, here's the object that inquirer would return
  ${JSON.stringify(answers)}`)
  );
