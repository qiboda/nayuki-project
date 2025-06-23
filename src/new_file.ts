
import * as vscode from 'vscode';

import { XmakeCommand, Target } from './xmake';
import { Utils } from './utils';
import path from 'path';


export class NewFileCommand {

    public register(context: vscode.ExtensionContext, xmakeCommand: XmakeCommand) {
        const newFile = vscode.commands.registerCommand('nayuki-project.newFile', async (uri: vscode.Uri) => {

            if (!uri) {
                uri = vscode.Uri.file(Utils.getWorkspaceFolderPath());
            }

            // 检查uri是否是target之一，如果不是，就提示选择一个目标，之后，再进行创建
            let [isInTargets, target] = xmakeCommand.checkPathInTargets(uri.fsPath);

            if (isInTargets) {
                let classFolderPath = Utils.getTargetSubFolderPath(uri, target!);
                await this.newFile(target, xmakeCommand, classFolderPath);
            }
            else {

                const targetNames = xmakeCommand.getNayukiTargetNames();

                const selection = await vscode.window.showQuickPick(targetNames, {
                    placeHolder: '请选择一个模块',
                });

                if (selection) {
                    let target = xmakeCommand.getNayukiTargetByName(selection);
                    if (target) {
                        await this.newFile(target, xmakeCommand);
                    } else {
                        vscode.window.showErrorMessage('没有找到目标');
                    }
                }
            }
        });
        context.subscriptions.push(newFile);
    }

    private async newFile(target: Target | undefined, xmakeCommand: XmakeCommand, classFolderPath: string = "") {
        await vscode.window.showInputBox({
            prompt: 'Enter file name',
            placeHolder: 'file name',
            value: path.join(classFolderPath, 'Filename'),
            validateInput: (value: string) => {
                if (value.length === 0) {
                    return 'File name cannot be empty';
                }
                const parts = value.split("/");
                for (const part of parts) {
                    // 检查目录名和文件名是否符合要求，全部小写，下划线分隔
                    if (!/^[a-z][a-z0-9_]*$/.test(part)) {
                        return 'Directory name and file name must be lowercase and can only contain letters, digits, and underscores';
                    }
                }
                return null;
            }
        }).then(async (fileNameWithDir: string | undefined) => {

            if (fileNameWithDir) {

                let dirParts = fileNameWithDir.split("/");
                let filename = dirParts.pop()!;

                let dir = dirParts.join("/");

                let targetName = target!.name;
                let folderPath = vscode.Uri.file(target!.path);

                const headerFileName = `${filename}.h`;
                const headerFilePath = vscode.Uri.joinPath(folderPath, "include", targetName, dir, headerFileName);

                const headerContent =
                    `#pragma once

#include <core/minimal.h>
#include <${targetName}/minimal.h>
`;

                const srcFileName = `${filename}.cpp`;
                const srcFilePath = vscode.Uri.joinPath(folderPath, "src", dir, srcFileName);
                const srcContent = `
#include "${targetName}/${dir ? dir + "/" : ""}${headerFileName}"
    `;

                Promise.all([
                    await vscode.workspace.fs.writeFile(headerFilePath, Buffer.from(headerContent)),
                    await vscode.workspace.fs.writeFile(srcFilePath, Buffer.from(srcContent))
                ]).then(async () => {
                    await vscode.workspace.openTextDocument(srcFilePath);
                    await vscode.workspace.openTextDocument(headerFilePath);
                    await vscode.window.showTextDocument(headerFilePath);

                    xmakeCommand.xmakeGenerateCompileCommand();
                });
            }
        });
    }
}