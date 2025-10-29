# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TaskStarter is a VS Code extension that streamlines Azure DevOps task management by allowing developers to start, track, and finish tasks directly from VS Code without navigating to the Azure DevOps web interface.

## Development Commands

### Build and Development
- `npm run compile` - Compile TypeScript to JavaScript
- `npm run watch` - Watch mode for TypeScript compilation
- `npm run esbuild` - Bundle extension with sourcemap
- `npm run esbuild-watch` - Bundle in watch mode
- `npm run vscode:prepublish` - Production build (minified)

### Testing and Quality
- `npm run lint` - Run ESLint on src files
- `npm run test` - Run all tests (runs pretest first)
- `npm run pretest` - Compile and lint before testing

### Packaging
- `npm run package` - Create extension package (.vsix) in build/ directory

### Development Workflow
- Press F5 in VS Code to launch Extension Development Host for testing
- Use `npm run esbuild-watch` during development for auto-rebuilding
- Compiled JavaScript outputs to `out/` directory

## Architecture

### Core Components

**Extension Entry Point (`src/extension.ts`)**
- Activates extension and registers all commands
- Manages initialization state and prompts
- Sets up configuration change listeners

**Configuration System (`src/configuration.ts`)**
- Handles project-specific settings stored in VS Code workspace configuration
- Manages secure storage for PAT tokens using VS Code secrets API
- Project configs are stored per workspace folder name

**Task Management Commands (`src/commands/`)**
- `StartTask/` - Core task starting functionality with search and parent task support
- `FinishTask/` - Task completion and branch cleanup
- `CreatePullRequest/` - PR creation workflow
- `MoveTaskToInProgress/` - Board state management
- `SetTokenCommand/`, `SetTeam/`, etc. - Configuration setup commands

**Azure DevOps Integration (`src/api.ts`)**
- Centralized API communication with Azure DevOps
- Uses `azure-devops-node-api` library for API calls
- HTTP requests handled via `axios`

**Git Integration (`src/git.ts`)**
- Branch creation and checkout functionality
- Git command execution for task workflow
- Branch naming follows pattern: `feature/${taskId}-${sanitizedTaskName}`

**Current Task Tracking (`src/CurrentTaskTracker.ts`)**
- Maintains state of currently active task
- Updates VS Code status bar with task information

### Key Patterns

**Command Structure**: Each command follows a pattern of having its own directory with:
- Main command file (e.g., `startTask.ts`)
- API functions (`api.ts`)
- Type definitions (`types.ts`)
- Error classes in `errors/` subdirectory

**Configuration Access**: Use `getProjectKey()` for workspace settings and `getSecureKey()` for sensitive data like PAT tokens.

**Error Handling**: Custom error classes extend base Error and are organized in command-specific `errors/` directories.

## Configuration

The extension requires Azure DevOps configuration per project:
- PAT token (stored securely)
- Organization, project, and team names
- Optional: custom branch regex, board column names

## Testing

Tests are located in `src/test/` and use Mocha framework. Run `npm run test` to execute all tests.

## Code Style

- ESLint configuration in `.eslintrc.json` with TypeScript support
- Prettier formatting with single quotes, no semicolons, 100 char width
- Strict TypeScript compilation enabled

## Dependencies

### Key Libraries
- `azure-devops-node-api` - Azure DevOps REST API client
- `axios` - HTTP requests
- `lodash` - Utility functions
- `pino` - Structured logging
- `fast-memoize`/`moize` - Function memoization for performance

### VS Code Extension APIs
- Commands, configuration, secrets storage, status bar, quick pick UI