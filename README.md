# Task starter

Makes it easy to start a tasks in Azure DevOps. 
No more going to the insanely slow page of dev.azure.com to find the task you'll need to work on.
## Sales pitch 
Are you tired of having to go to your Azure DevOps sprint board to find the task you are suppose to work on just to get the ID of the task ?
Do you name your feature branches like this: `feature/${taskID}-${taskName}`? 

Well it MIGHT just be your lucky day !

This extension fixes that !

Now you can start your task from the comfort of your lovely little memory-hogging vscode "ide". 

Just use the "Start new task" command, and it will display the tasks in the current iteration of your sprint!
Find the task you want to work on and hit enter.
It will magically create a new branch with the correct name for you, no need to intervene (there might be)!


## Features

- Easy fetch and picking of tasks in the current iteration
- Creates a branch for the task
- Moves task to the 'in progress' column of your sprint board
- Automatically assigns you to the task if the task is unassigned

## Settings

The settings objects are structured as such in User Settings

```json
"taskstarter.projectConfigs": [
	{
		"projectName": "NAME OF YOUR PROJECT"
		// other settings
	},
	{
		"projectName": "NAME OF ANOTHER PROJECT",
		// other settings
	}
]
```

### Settings reference

| Setting name               | Description                                                                                      | type      | Default                   | Required |  
| -------------------------- | ------------------------------------------------------------------------------------------------ | --------- | ------------------------- | -------- |  
| `projectName`              | Local project name of the folder in VSCode                                                       | `string`  |                           | `true`   |
| `devopsPATToken`           | The Azure DevOps token to communicate with DevOps. It's recommended to be as strict as possible. | `string`  |                           | `true`   |
| `devopsProject`            | The Azure DevOps project name.                                                                   | `string`  |                           | `true`   |
| `devopsOrganization`       | The Azure DevOps organization name.                                                              | `string`  |                           | `true`   |
| `devopsTeam`               | The Azure DevOps team name.                                                                      | `string`  |                           | `true`   |
| `devopsInstanceUrl`        | The Azure DevOps url.                                                                            | `string`  | `"https://dev.azure.com"` |          |
| `autoAssignTask`           | Automatically assign task to the owner of the PAT                                                | `boolean` | `true`                    |          |
| `autoMoveTaskToInProgress` | Automatically move task to the 'in-progress' column of the board                                 | `boolean` | `true`                    |          |
| `customBranchRegex`        | User settable regex used to sanitize the task name for naming the branch                         | `string`  |                           |          |
| `inProgressColumnName`     | The column name of the 'in-progress' column.                                                     | `string`  |                           |          |




## How to

First run the initialization process and input your DevOps PAT, organization, team and project - And ba-da-bing ba-da-boom, you are ready to use the extension.
## TODO
See [the project board](https://github.com/users/TheSinding/projects/3)

## DevOps PAT description

Token Permissions as a minimum
| Scope            | Access                    |
|------------------|---------------------------|
| User profile     | `Read`                    |
| Project and Team | `Read`                    |
| Work Items       | `Read`, `Write`, `Manage` |
