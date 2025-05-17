// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { NewClassCommand } from './new_class';
import { XmakeCommand } from './xmake';
import { NewModuleCommand } from './new_module';
import { NewTestsCommand } from './new_tests';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {


	vscode.window.showInformationMessage('nayuki extension is activated');

	// vscode.window.exp(editor => {
	// 	if (!editor || !editor.document) {
	// 		return;
	// 	}

	// 	const filePath = editor.document.uri.fsPath;

	// 	vscode.window.showErrorMessage('filePath: ' + filePath);

	// 	// 判断文件是否位于 src 或者examples 目录下
	// 	const isInNewClassNayukiFolder = filePath.includes('/src/') || filePath.includes("/examples/");

	// 	// 使用 setContext 设置上下文变量
	// 	vscode.commands.executeCommand('setContext', 'isInNewClassNayukiFolder', isInNewClassNayukiFolder);
	// });

	let xmakeCommand = new XmakeCommand();
	xmakeCommand.refreshNayukiInfo();

	xmakeCommand.isProgramInstalled("xmake").then((installed) => {
		if (!installed) {
			vscode.window.showErrorMessage('xmake need to be installed');
		}
	}).then(() => {
		xmakeCommand.xmakeGenerateWatcher(context);
	});

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
