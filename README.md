# inquirer-customizable
_An Inquirer prompt relying on user-defined input and rendering._

# What problem does it solve?
While using Inquirer.js included prompts (or the existing custom ones),
we it was difficult to customize inputs handling (e.g. checkbox, disable the `j`,`k` alternatives for up/down arrows)
or to customize the output (e.g. change the color of the highlighted selection etc).

To solve that, `inquirer-customizable` tries to solely handle data and states that make sense for a prompt and
leave the IO handling to the library users.
