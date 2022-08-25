# Change Log

## [Unreleased]

## [0.4.5] - 2022-08-25

### Fixes

- Fixes the error messages when you finish current task.
They are more descriptive, see [#56](https://github.com/TheSinding/taskstarter/issues/56)

## [0.4.4] - 2022-08-25

### Fixes

- Fixes current task not being set when a user reloads the window

## [0.4.3] - 2022-08-20

### Fixes

- Fixes the current task tracker, so it does not rely on the ID of a work task in the branch name, but rather uses the `.git/config` file.
It stores a `workitemid` key under the branch config in `.git/config`

## [0.4.2] - 2022-08-16

### Fixes

- Fixes the "Current task" item in statusbar showing all of the time

## [0.4.1] - 2022-08-16

### Fixes

- Fixes the remote repository matching to the local one

## [0.4.0] - 2022-08-15

### Adds

- Adds a output channel to help debugging



## [0.3.0] - 2022-08-15

### Adds

- Adds the ability to finish the current task, with a PR from vscode.
	Just use the command "Finish current task" and it will create a draft pull request for you, open it on devops, and you can fill in the details.

## [0.2.2] - 2022-08-13

### Fixes

- Fixes the queries, so it fits to all project setups.
- Fixes the default suggestion for a branch name, so it would have a "--" in front of it

## [0.2.1] - 2022-08-12

### Fixes

- Fixes an uncaught error, which resulted in infinite loading when you started from an empty parent

## [0.2.0] - 2022-08-12

### Adds

- Adds a reference item in statusbar to the current task
You can click it to open it on azure devops

- Adds buttons to open task on azure devops in both "Start task from parent"- and "Start task"-lists

### Fixes

- Reduces API calls to have listing work faster

## [0.1.0] - 2022-08-06

### Adds

- Adds ability start a task from a parent task.
There is a new command called "Start task from parent" which lists parents then you can pick a parent and then it will show you it's children.

- Adds automatically detecting of the branch type, so basically if it's a `bugfix` branch or `feature` branch

It's 1 am right now and I have no idea if it actually works as intended, but I don't want to sit here anymore. Im going to bed!

## [0.0.7] - 2022-08-06

### Adds

- Searching by description and detail - Now you can search by assignee, weight (Don't know why you would do that) & state

### Fixes

- Fixes multiple configuration

## [0.0.6] - 2022-08-03

### Fixes

- Fixes issue with getting more than 200 items from devops api

## [0.0.5] - 2022-08-01

- Updates readme

## [0.0.4] - 2022-08-01

### Added

- Moves and assigns a task to the user by default now

## [0.0.3] - 2022-07-29

### Changed

- Moves configuration from workspace eg. `.vscode/settings.json` to user settings
This is so multiple users of a repo can use it without overriding / exposing a token in a committed `.vscode/settings.json` file

### Fixed

- default branch regex were creating to many "-", now it only allows a max of 2 through

## [0.0.2] - 2022-07-28

### Fixed

- Branch regex were too lose and character which Windows didn't like got through

### Added

- Ability to add custom branch regex with property `customBranchRegex`
