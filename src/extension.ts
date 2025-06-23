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
export function activate(context: vscode.ExtensionContext) {


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
