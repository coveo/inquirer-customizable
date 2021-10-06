import inquirer from "inquirer";
import Separator from "inquirer/lib/objects/separator";
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
        new Separator("🥔"),
        { displayName: "Pipelines", id: "pipelines" },
      ],
      values: [
        { displayName: chalk`{green {bold A}dd}`, id: "add" },
        { displayName: chalk`{cyan {bold E}dit}`, id: "edit" },
        { displayName: chalk`{white {bold S}kip}`, id: "skip" },
        new Separator("🥔"),

        { displayName: chalk`{red {bold D}elete}`, id: "delete" },
      ],
      disabled: {
        sources: ["add"],
      },
      controls,
      renderer,
    },
  ])
  .then((answers) =>
    console.log(`Prompt session complete, here's the object that inquirer would return
  ${JSON.stringify(answers)}`)
  );
