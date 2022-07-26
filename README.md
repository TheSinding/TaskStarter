# Task starter

This a VSCode extensions which is very much geared toward my current workflow. So it might not be useful for you, **but** here is the sales pitch

## Sales pitch 
Are you tired of having to go to your Azure DevOps sprint board to find the task you are suppose to work on just to get the ID of the task ?
Do you name your feature branches like this: `feature/${taskID}-${taskName}`? 

Well it MIGHT just be your lucky day !

This extension fixes that !

Now you can start your task from the comfort of your lovely little memory-hogging vscode "ide". 

Just use the "Start new task" command, and it will display the tasks in the current iteration of your sprint!
Find the task you want to work on and hit enter.
It will magically create a new branch with the correct name for you, no need to intervene (there might be)!


## How to

First run the initialization process and input your DevOps PAT, organization, team and project - And ba-da-bing ba-da-boom, you are ready to use the extension.

## Notice

This is probably not working.

## TODO
[ ] - order your task on top
[ ] - Move the task you started to in progress
[ ] - Put you on the picked task if the task is `unassigned`
[ ] - more? 
[ ] - Store PAT token somewhere else than `.vscode/settings.json`
[ ] - Remove information about "checking out dev" because it's not.

## DevOps PAT description

Token Permissions as a minimum
Scope|Access
---|---
User profile | `Read`
Project and Team | `Read`
Work Items | `Read`, `Write`, `Manage`