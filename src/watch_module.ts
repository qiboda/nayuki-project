import * as vscode from 'vscode';
import { XmakeCommand } from './xmake';
import { Utils } from './utils';

export class WatchModuleCommand {
    private watcher: vscode.FileSystemWatcher | undefined;

    public register(context: vscode.ExtensionContext, xmakeCommand: XmakeCommand) {
        // 如何获得workspace的根目录
        const workspaceFolder = Utils.getWorkspaceFolderPath();
        const pattern = new vscode.RelativePattern(workspaceFolder, 'src/**/*.{ixx,cpp}');
        this.watcher = vscode.workspace.createFileSystemWatcher(pattern);

        this.watcher.onDidChange(uri => {
            vscode.window.showInformationMessage(`Module file changed: ${uri.fsPath}`);
            xmakeCommand.xmakeCompileArgs();
        });

        this.watcher.onDidCreate(uri => {
            vscode.window.showInformationMessage(`Module file created: ${uri.fsPath}`);
            xmakeCommand.xmakeCompileArgs();
        });

        this.watcher.onDidDelete(uri => {
            vscode.window.showInformationMessage(`Module file deleted: ${uri.fsPath}`);
            xmakeCommand.xmakeCompileArgs();
        });

        context.subscriptions.push(this.watcher);
    }
}