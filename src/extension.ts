// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { NewClassCommand } from './new_class';
import { XmakeCommand } from './xmake';
import { NewModuleCommand } from './new_module';
import { NewTestsCommand } from './new_tests';
import { NewFileCommand } from './new_file';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	const xmakeExtension = vscode.extensions.getExtension("tboox.xmake-vscode");
	if (xmakeExtension) {
		await xmakeExtension.activate(); // 必须先激活
		const api = xmakeExtension.exports;

		// 你现在可以调用 API 了，例如：
		// api.doSomething();
	}

	vscode.window.showInformationMessage('nayuki extension is activated');

	let xmakeCommand = new XmakeCommand();
	xmakeCommand.refreshNayukiInfo();

	xmakeCommand.isProgramInstalled("xmake").then((installed) => {
		if (!installed) {
			vscode.window.showErrorMessage('xmake need to be installed');
		}
	}).then(() => {
		xmakeCommand.xmakeGenerateWatcher(context);
	});

	let newFileCommand = new NewFileCommand();
	newFileCommand.register(context, xmakeCommand);

	let newClassCommand = new NewClassCommand();
	newClassCommand.register(context, xmakeCommand);

	let newModuleCommand = new NewModuleCommand();
	newModuleCommand.register(context, xmakeCommand);

	let newTestsCommand = new NewTestsCommand();
	newTestsCommand.register(context, xmakeCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {
	vscode.window.showInformationMessage('nayuki extension is deactivated');
}
