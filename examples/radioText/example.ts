import inquirer from "inquirer";
import { renderer } from "./radioTextRenderer";
import { checkboxControls as controls } from "./radioTextControls";
import {
  CustomizablePromptAnswers,
  CustomizablePrompt,
} from "../../src/customizablePrompt";
import chalk from "chalk";

inquirer.registerPrompt("test", CustomizablePrompt);

inquirer
  .prompt<CustomizablePromptAnswers>([
    {
      type: "test",
      name: "hi",
      style: "radio",
      keys: [
        { displayName: "Sources", id: "sources" },
        { displayName: "Fields", id: "fields" },
        { displayName: "Pipelines", id: "pipelines" },
      ],
      values: [
        { displayName: chalk`{green {bold A}dd}`, id: "add" },
        { displayName: chalk`{cyan {bold E}dit}`, id: "edit" },
        { displayName: chalk`{white {bold S}kip}`, id: "skip" },
        { displayName: chalk`{red {bold D}elete}`, id: "delete" },
      ],
      controls,
      renderer: renderer,
    },
  ])
  .then((answers) =>
    console.log(`Prompt session complete, here's the object that inquirer would return
  ${JSON.stringify(answers)}`)
  );
