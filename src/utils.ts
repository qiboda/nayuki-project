import * as vscode from 'vscode';

export class Utils {
    // get workspace folder path
    public static getWorkspaceFolderPath(): string {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            return workspaceFolders[0].uri.fsPath;
        } else {
            throw new Error('No workspace folder found');
        }
    }


    public static normalizeToSnakeCase(input: string): string {
        if (/^[A-Z0-9_]+$/.test(input)) {
            // ALL_CAPS → just lower it
            return input.toLowerCase();
        } else {
            // camelCase or PascalCase
            return input
                .replace(/([A-Z])/g, "_$1")
                .replace(/^_/, "")
                .toLowerCase();
        }
    }
}