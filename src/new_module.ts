import { Utils } from "./utils";
import * as vscode from "vscode";
import { XmakeCommand } from "./xmake";

function minimalTemplate(moduleName: string): string {
    return `
#pragma once

    `;
}

function moduleHeaderTemplate(moduleName: string): string {

    let moduleNameMacro = Utils.normalizeToUpperCase(moduleName);
    let moduleNameUpperCamelCase = Utils.normalizeToUpperCamelCase(moduleName);
    return `
#pragma once

#include <core/core.h>

#include <${moduleName}/minimal.h>

${moduleNameMacro}_API NY_LOG_CATEGORY_DECLARED( Log${moduleNameUpperCamelCase} )
`;
}

function moduleSrcTemplate(moduleName: string): string {

    let moduleNameUpperCamelCase = Utils.normalizeToUpperCamelCase(moduleName);
    return `
#include <core/core.h>
#include <core/memory/global_new.h>

#include <${moduleName}/${moduleName}.h>

NY_LOG_CATEGORY_DEFINITION( Log${moduleNameUpperCamelCase} )
`;
}

function xmakeTemplate(moduleName: string): string {

    let module_name_macro = Utils.normalizeToUpperCase(moduleName);
    return `
module_name = "${moduleName}"
module_name_macro = "${module_name_macro}"

target(module_name)
    set_kind("shared")

    set_group("libraries")

    add_files("module/**.ixx")
    add_files("src/**.cpp")
    add_includedirs("include", { public = true })
    add_headerfiles("include/**.h", { public = true })

    -- 必须定义
    add_defines(module_name_macro .. "_EXPORTS")

    -- 这两个选项同时使用，生成独立的debug符号信息。
    set_symbols("debug")
    set_strip("all")

    add_deps("core")
`;
}

export class NewModuleCommand {

    public register(context: vscode.ExtensionContext, xmakeCommand: XmakeCommand) {
        const workspaceFolderPath = Utils.getWorkspaceFolderPath();
        const newClass = vscode.commands.registerCommand('nayuki-project.newModule', async () => {

            const targetNames = xmakeCommand.getNayukiTargetNames();

            // 显示一个用户输入框
            vscode.window.showInputBox({
                prompt: '请输入模块名称',
                placeHolder: 'module_name',
                validateInput: (input: string) => {
                    if (!input) {
                        return "模块名称不能为空";
                    }
                    // 检查模块名称是否已经存在
                    if (targetNames.includes(input)) {
                        return '模块名称已经存在';
                    }
                    // 检查模块名称是否符合规范
                    if (!/^[a-z][a-z0-9_]*$/.test(input)) {
                        return '模块名称只能是小写字母、数字和下划线，且不能以数字和下划线开头';
                    }
                    return null;
                }
            })
                .then(async (moduleName) => {
                    if (!moduleName) {
                        return;
                    }
                    // 创建新模块
                    let workspaceFolderPathUri = vscode.Uri.file(workspaceFolderPath);
                    const modulePath = vscode.Uri.joinPath(workspaceFolderPathUri, 'src', moduleName);

                    let xmakeFileContent = xmakeTemplate(moduleName);
                    let xmakeFilePath = vscode.Uri.joinPath(modulePath, 'xmake.lua');

                    let headerFileContent = moduleHeaderTemplate(moduleName);
                    let headerFilePath = vscode.Uri.joinPath(modulePath, 'include', moduleName, `${moduleName}.h`);

                    let srcFileContent = moduleSrcTemplate(moduleName);
                    let srcFilePath = vscode.Uri.joinPath(modulePath, 'src', `${moduleName}.cpp`);

                    let minimalFileContent = minimalTemplate(moduleName);
                    let minimalFilePath = vscode.Uri.joinPath(modulePath, 'include', moduleName, 'minimal.h');

                    Promise.all([
                        vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(modulePath, 'include', moduleName)),
                        vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(modulePath, 'src')),
                    ]).then(async () => {
                        Promise.all([
                            await vscode.workspace.fs.writeFile(xmakeFilePath, Buffer.from(xmakeFileContent)),

                            await vscode.workspace.fs.writeFile(headerFilePath, Buffer.from(headerFileContent)),

                            await vscode.workspace.fs.writeFile(srcFilePath, Buffer.from(srcFileContent)),

                            await vscode.workspace.fs.writeFile(minimalFilePath, Buffer.from(minimalFileContent)),
                        ]).then(async () => {
                            vscode.window.showInformationMessage(`新模块已创建：${moduleName}`);
                            await xmakeCommand.xmakeGenerate();
                        });
                    });
                });
        });
        context.subscriptions.push(newClass);
    }
}
