
import * as vscode from 'vscode';

import { XmakeCommand, Target } from './xmake';
import { Utils } from './utils';
import path from 'path';


export class NewClassCommand {

    public register(context: vscode.ExtensionContext, xmakeCommand: XmakeCommand) {
        const newClass = vscode.commands.registerCommand('nayuki-project.newClass', async (uri: vscode.Uri) => {

            if (!uri) {
                uri = vscode.Uri.file(Utils.getWorkspaceFolderPath());
            }

            // 检查uri是否是target之一，如果不是，就提示选择一个目标，之后，再进行创建
            let [isInTargets, target] = xmakeCommand.checkPathInTargets(uri.fsPath);

            if (isInTargets) {
                let classFolderPath = Utils.getTargetSubFolderPath(uri, target!);
                await this.newClass(target, xmakeCommand, classFolderPath);
            }
            else {

                const targetNames = xmakeCommand.getNayukiTargetNames();

                const selection = await vscode.window.showQuickPick(targetNames, {
                    placeHolder: '请选择一个模块',
                });

                if (selection) {
                    let target = xmakeCommand.getNayukiTargetByName(selection);
                    if (target) {
                        await this.newClass(target, xmakeCommand);
                    } else {
                        vscode.window.showErrorMessage('没有找到目标');
                    }
                }
            }
        });
        context.subscriptions.push(newClass);
    }

    private async newClass(target: Target | undefined, xmakeCommand: XmakeCommand, classFolderPath: string = "") {
        await vscode.window.showInputBox({
            prompt: 'Enter class name',
            placeHolder: 'Class name',
            value: path.join(classFolderPath, 'MyClass'),
            validateInput: (value: string) => {
                if (value.length === 0) {
                    return 'Class name cannot be empty';
                }
                const parts = value.split("/");
                const className = parts.pop()!;
                for (const part of parts) {
                    // 检查目录名是否符合要求，全部小写，下划线分隔
                    if (!/^[a-z][a-z0-9_]*$/.test(part)) {
                        return 'Directory name must be lowercase and can only contain letters, digits, and underscores';
                    }
                }

                if (!/^[A-Z][a-zA-Z0-9]*$/.test(className)) {
                    return 'Class name must start with a capital letter and contain only letters and digits';
                }
                return null;
            }
        }).then(async (classNameWithDir: string | undefined) => {

            if (classNameWithDir) {

                let classParts = classNameWithDir.split("/");
                let className = classParts.pop()!;

                let classDir = classParts.join("/");
                let filename = Utils.normalizeToSnakeCase(className);

                let targetName = target!.name;
                let targetNameMacro = Utils.normalizeToUpperCase(targetName);
                let folderPath = vscode.Uri.file(target!.path);

                const headerFileName = `${filename}.h`;
                const headerFilePath = vscode.Uri.joinPath(folderPath, "include", targetName, classDir, headerFileName);

                const headerContent =
                    `#pragma once

#include <core/minimal.h>
#include <${targetName}/minimal.h>

class ${targetNameMacro}_API ${className} 
{
    public:
        ${className}();
};`;

                const srcFileName = `${filename}.cpp`;
                const srcFilePath = vscode.Uri.joinPath(folderPath, "src", classDir, srcFileName);
                const srcContent = `
#include "${targetName}/${classDir ? classDir + "/" : ""}${headerFileName}"

${className}::${className}() {} 
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