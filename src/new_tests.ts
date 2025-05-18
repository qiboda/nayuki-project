import * as vscode from 'vscode';
import { Target, XmakeCommand } from './xmake';
import { Utils } from './utils';
import * as fs from 'fs';

export class NewTestsCommand {

    public register(context: vscode.ExtensionContext, xmakeCommand: XmakeCommand) {
        const newTests = vscode.commands.registerCommand('nayuki-project.newTests', async (uri: vscode.Uri) => {

            if (!uri) {
                uri = vscode.Uri.file(Utils.getWorkspaceFolderPath());
            }

            // 检查uri是否是target之一，如果不是，就提示选择一个目标，之后，再进行创建
            let [isInTargets, target] = xmakeCommand.checkPathInTargets(uri.fsPath, true);

            if (isInTargets) {
                await this.newTests(target, xmakeCommand);
            }
            else {
                const targetNames = xmakeCommand.getNayukiTargetNames(true);
                // targetNames.push("创建在全局");

                const selection = await vscode.window.showQuickPick(targetNames, {
                    placeHolder: '请选择一个模块',
                });

                if (selection) {
                    let target = xmakeCommand.getNayukiTargetByName(selection);
                    if (target) {
                        await this.newTests(target, xmakeCommand);
                    } else {
                        // if ("创建在全局" === selection) {
                        //     await this.newTests(undefined, xmakeCommand);
                        // }
                        // else {
                        vscode.window.showErrorMessage('没有找到目标');
                        // }
                    }
                }
            }
        });

        context.subscriptions.push(newTests);
    }


    // target is null means global
    newTests(target: Target | undefined, xmakeCommand: XmakeCommand) {
        // 创建在全局目录下。
        if (target === undefined) {

            // let workspaceFolderPathUri = vscode.Uri.file(Utils.getWorkspaceFolderPath());
            // let globalTestsPath = vscode.Uri.joinPath(workspaceFolderPathUri, 'tests');

            // vscode.workspace.fs.createDirectory(globalTestsPath).then(async () => {
            //     let testsPath = vscode.Uri.joinPath(globalTestsPath, testsName);

            //     let xmakeFilePath = vscode.Uri.joinPath(globalTestsPath, 'xmake.lua');
            //     await vscode.workspace.fs.writeFile(xmakeFilePath, Buffer.from(xmakeFileContent));
            // });
        }
        else {

            let targetPath = vscode.Uri.file(target.path);
            const testsPath = vscode.Uri.joinPath(targetPath, 'tests');

            if (fs.existsSync(testsPath.fsPath)) {
                vscode.window.showErrorMessage(`模块${target.name}的tests已经存在`);
                return;
            }

            vscode.workspace.fs.createDirectory(testsPath).then(async () => {
                let xmakeFilePath = vscode.Uri.joinPath(testsPath, 'xmake.lua');
                let xmakeFileContent =
                    `
-- if has_config("test") then
add_requires("gtest", { configs = { gtest_build_tests = false } })
--end

target("${target.name}_tests")
    set_kind("binary")
    add_files("**.cpp")

    add_tests("default")
    set_group("tests")

    --默认情况下不编译
    set_default(false)

    add_packages("gtest", "glm", "tbb", "rpmalloc")

    --添加本地target依赖
    add_deps("core")
    add_deps("${target.name}")

    if is_host("windows") then
        --使用gtest的宏在windows中会报错
        add_cxxflags("-Wno-unsafe-buffer-usage")
    end
                    `;
                let testsMainPath = vscode.Uri.joinPath(testsPath, 'tests_main.cpp');
                let testsMainContent =
                    `
#include <gtest/gtest.h>
#include <core/memory/global_new.h>

int main( int argc, char** argv )
{
    ::testing::InitGoogleTest( &argc, argv );
    return RUN_ALL_TESTS();
}
                `;

                Promise.all([
                    await vscode.workspace.fs.writeFile(xmakeFilePath, Buffer.from(xmakeFileContent)),
                    await vscode.workspace.fs.writeFile(testsMainPath, Buffer.from(testsMainContent))
                ]).then(async () => {
                    await vscode.workspace.openTextDocument(xmakeFilePath);
                    await vscode.window.showTextDocument(xmakeFilePath);

                    xmakeCommand.xmakeGenerateCompileCommand();
                });
            });
        }
    }
}