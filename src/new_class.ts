
import * as vscode from 'vscode';

import { XmakeCommand, Target } from './xmake';
import { Utils } from './utils';

async function dynamicQuickPick() {
    const quickPick = vscode.window.createQuickPick();

    // 模拟初始选项
    const options = ['项目 A', '项目 B', '项目 C'];
    quickPick.items = options.map(item => ({ label: item }));

    // 显示 QuickPick
    quickPick.placeholder = '请输入或选择一个项目';

    quickPick.onDidChangeValue((value) => {
        // 每次输入发生变化时，根据输入更新选项
        const filteredOptions = options.filter(option =>
            option.toLowerCase().includes(value.toLowerCase())
        );

        if (value) {
            // 添加一个 "创建新项目" 选项
            filteredOptions.push(`🔧 创建新项目: ${value}`);
        }

        quickPick.items = filteredOptions.map(item => ({ label: item }));
    });

    quickPick.onDidAccept(() => {
        const selected = quickPick.selectedItems[0]?.label;

        if (selected) {
            if (selected.startsWith('🔧')) {
                // 用户选择了创建新项目
                vscode.window.showInputBox({
                    prompt: '请输入新项目的名称',
                    placeHolder: '例如：NewProject'
                }).then(input => {
                    if (input) {
                        vscode.window.showInformationMessage(`新项目已创建：${input}`);
                    }
                });
            } else {
                // 用户选择了现有项目
                vscode.window.showInformationMessage(`你选择了：${selected}`);
            }
        }
    });

    quickPick.onDidHide(() => {
        // 关闭时清理资源
        quickPick.dispose();
    });

    quickPick.show();
}


async function pick() {
}

export class NewClassCommand {

    public register(context: vscode.ExtensionContext, xmakeCommand: XmakeCommand) {
        const newClass = vscode.commands.registerCommand('nayuki-project.newClass', async (uri: vscode.Uri) => {

            if (!uri) {
                uri = vscode.Uri.file(Utils.getWorkspaceFolderPath());
            }

            // 检查uri是否时target之一，如果不是，就提示选择一个目标，之后，再进行创建
            let [isInTargets, target] = xmakeCommand.checkPathInTargets(uri.fsPath);

            if (isInTargets) {
                await this.newClass(target, xmakeCommand);
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

    private async newClass(target: Target | undefined, xmakeCommand: XmakeCommand) {
        await vscode.window.showInputBox({
            prompt: 'Enter class name',
            placeHolder: 'Class name',
            value: 'MyClass',
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
                let folderPath = vscode.Uri.file(target!.path);

                const headerFileName = `${filename}.h`;
                const headerFilePath = vscode.Uri.joinPath(folderPath, "include", targetName, classDir, headerFileName);

                const headerContent =
                    `#pragma once

class ${className} 
{
    public:
        ${className}();
        ~${className}();
};`;

                const srcFileName = `${filename}.cpp`;
                const srcFilePath = vscode.Uri.joinPath(folderPath, "src", classDir, srcFileName);
                const srcContent = `
#include <${targetName}/minimal.h>
#include "${targetName}/${classDir ? classDir + "/" : ""}${headerFileName}"

${className}::${className}() {} 
    `;

                Promise.all([
                    await vscode.workspace.fs.writeFile(headerFilePath, Buffer.from(headerContent)),
                    await vscode.workspace.fs.writeFile(srcFilePath, Buffer.from(srcContent))
                ]).then(() => {
                    xmakeCommand.xmakeGenerateCompileCommand();
                });
            }
        });
    }
}