# Change Log

## [Unreleased]

- Reference to current task
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
