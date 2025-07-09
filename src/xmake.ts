import { exec } from 'child_process';
import * as vscode from 'vscode';
import { Utils } from './utils';

export class Target {
    public kind: string;
    public name: string;
    public group: string;
    public path: string;

    constructor() {
        this.kind = "";
        this.name = "";
        this.group = "";
        this.path = "";
    }
}

export class Tests {
    public target_name: string;
    public test_names: string[];

    constructor() {
        this.target_name = "";
        this.test_names = [];
    }
}

export class NayukiConfig {
    public targets: Target[];
    public name: string;
    public version: string;
    public tests: Tests[];

    constructor() {
        this.targets = [];
        this.name = "";
        this.version = "";
        this.tests = [];
    }
}


export class XmakeCommand {

    constructor() {
        this.nayukiConfig = new NayukiConfig();
    }

    nayukiConfig: NayukiConfig;

    public isProgramInstalled(program: string): Promise<boolean> {
        const command = `${program} -h`;

        return new Promise((resolve) => {
            exec(command, (error, stdout, stderr) => {
                resolve(!error && !!stdout.trim() && !stderr.trim());
            });
        });
    }

    public xmakeGenerateCompileCommand() {
        const command = `xmake project -k compile_commands --lsp=clangd`;

        return new Promise((resolve) => {
            let cwd = Utils.getWorkspaceFolderPath();
            exec(command, { cwd }, (error, stdout, stderr) => {
                if (error) {
                    vscode.window.showErrorMessage(`xmake project -k compile_commands --lsp=clangd error: ${error.message}`);
                    resolve(false);
                } else if (stderr) {
                    vscode.window.showErrorMessage(`xmake project -k compile_commands --lsp=clangd error: ${stderr}`);
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    xmakeModuleExport() {
        const command = `xmake module_export`;

        return new Promise((resolve) => {
            let cwd = Utils.getWorkspaceFolderPath();
            exec(command, { cwd }, (error, stdout, stderr) => {
                if (error) {
                    vscode.window.showErrorMessage(`xmake build failed: ${error.message}`);
                    resolve(false);
                } else if (stderr) {
                    vscode.window.showErrorMessage(`xmake build error: ${stderr}`);
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    xmakeFixcc() {
        const command = `xmake fixcc`;

        return new Promise((resolve) => {
            let cwd = Utils.getWorkspaceFolderPath();
            exec(command, { cwd }, (error, stdout, stderr) => {
                if (error) {
                    vscode.window.showErrorMessage(`xmake fixcc failed: ${error.message}`);
                    resolve(false);
                } else if (stderr) {
                    vscode.window.showErrorMessage(`xmake fixcc error: ${stderr}`);
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    xmakeNayuki() {
        const command = `xmake nayuki`;
        return new Promise((resolve) => {
            let cwd = Utils.getWorkspaceFolderPath();
            exec(command, { cwd }, (error, stdout, stderr) => {
                if (error) {
                    vscode.window.showErrorMessage(`xmake nayuki failed: ${error.message}`);
                    resolve(false);
                } else if (stderr) {
                    vscode.window.showErrorMessage(`xmake nayuki error: ${stderr}`);
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    async xmakeGenerate() {
        await this.xmakeModuleExport().then(async () => {
            await this.xmakeFixcc().then(async () => {
                await this.xmakeNayuki().then(() => {
                }).catch(() => {
                    vscode.window.showErrorMessage('xmake nayuki failed');
                });
            }).catch(() => {
                vscode.window.showErrorMessage('xmake fixcc failed');
            });
        }).catch(() => {
            vscode.window.showErrorMessage('xmake build failed');
        });
    }

    public xmakeGenerateWatcher(context: vscode.ExtensionContext) {
        let workspaceFolderPath = Utils.getWorkspaceFolderPath();
        const pattern = new vscode.RelativePattern(workspaceFolderPath, '.vscode/compile_commands.json');
        const watcher = vscode.workspace.createFileSystemWatcher(pattern);

        watcher.onDidChange(uri => {
            this.xmakeGenerate().then(() => {
            }).catch(() => {
                vscode.window.showErrorMessage('xmake generate failed');
            }).then(() => {
                this.refreshNayukiInfo();
            });
        });

        watcher.onDidCreate(uri => {
            this.xmakeGenerate().then(() => {
            }).catch(() => {
                vscode.window.showErrorMessage('xmake generate failed');
            }).then(() => {
                this.refreshNayukiInfo();
            });
        });

        watcher.onDidDelete(uri => {
            this.xmakeGenerate().then(() => {
            }).catch(() => {
                vscode.window.showErrorMessage('xmake generate failed');
            }).then(() => {
                this.refreshNayukiInfo();
            });
        });

        context.subscriptions.push(watcher);
    }

    refreshNayukiInfo() {

        // 读取 .nayuki/nayuki.json 文件, 存储进全局变量中。
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return;
        }

        const nayukiJsonPath = vscode.Uri.joinPath(workspaceFolders[0].uri, '.nayuki/nayuki.json');
        vscode.workspace.fs.readFile(nayukiJsonPath).then((data) => {
            let jsonObject = JSON.parse(data.toString());

            Object.assign(this.nayukiConfig, jsonObject);
        });
    }

    public getNayukiConfig(): any {
        return this.nayukiConfig;
    }

    public checkPathInTargets(path: string, exclusive_test: boolean = true): [boolean, Target?] {
        if (!this.nayukiConfig) {
            return [false, undefined];
        }

        let targets = this.nayukiConfig.targets;
        for (let target of targets) {
            if (exclusive_test) {
                if (target.group === "tests") {
                    continue;
                }
            }
            if (path.includes(target.path) && path.replace(target.path, "").startsWith("/")) {
                return [true, target];
            }
        }
        return [false, undefined];
    }

    public getNayukiTargetNames(exclusive_test: boolean = true): string[] {
        if (!this.nayukiConfig) {
            return [];
        }

        const targets = this.nayukiConfig.targets;
        if (!targets) {
            return [];
        }

        let target_names = [];
        for (const target of targets) {
            if (target && target.name) {
                if (exclusive_test) {
                    if (target.group === "tests") {
                        continue;
                    }
                }
                target_names.push(target.name);
            }
        }
        return target_names;
    }

    public getNayukiTargetByName(name: string): Target | undefined {
        if (!this.nayukiConfig) {
            return undefined;
        }

        const targets = this.nayukiConfig.targets;
        if (!targets) {
            return undefined;
        }

        for (const target of targets) {
            if (target && target.name === name) {
                return target;
            }
        }
        return undefined;
    }
}