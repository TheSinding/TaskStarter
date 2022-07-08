import { extensions } from 'vscode';

const gitExport = extensions.getExtension('vscode.git')?.exports;
export const git = gitExport.getGitPath();