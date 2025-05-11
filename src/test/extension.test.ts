import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { Utils } from '../utils';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('test utils normalizeToSnakeCase', () => {
		const case1 = "HelloWorld";
		const case2 = "hello_world";
		const case3 = "HELLO_WORLD";

		const SnakeCase1 = Utils.normalizeToSnakeCase(case1);
		const SnakeCase2 = Utils.normalizeToSnakeCase(case2);
		const SnakeCase3 = Utils.normalizeToSnakeCase(case3);

		assert.strictEqual(SnakeCase1, "hello_world");
		assert.strictEqual(SnakeCase2, "hello_world");
		assert.strictEqual(SnakeCase3, "hello_world");
	}
	);

	test('test utils normalizeToUpperCase', () => {
		const case1 = "HelloWorld";
		const case2 = "hello_world";
		const case3 = "HELLO_WORLD";

		const UpperCase1 = Utils.normalizeToUpperCase(case1);
		const UpperCase2 = Utils.normalizeToUpperCase(case2);
		const UpperCase3 = Utils.normalizeToUpperCase(case3);

		assert.strictEqual(UpperCase1, "HELLOWORLD");
		assert.strictEqual(UpperCase2, "HELLO_WORLD");
		assert.strictEqual(UpperCase3, "HELLO_WORLD");
	}
	);

	test('test utils normalizeToUpperCamelCase', () => {
		const case1 = "hello_world";
		const case2 = "helloWorld";
		const case3 = "HELLO_WORLD";

		const UpperCamelCase1 = Utils.normalizeToUpperCamelCase(case1);
		const UpperCamelCase2 = Utils.normalizeToUpperCamelCase(case2);
		const UpperCamelCase3 = Utils.normalizeToUpperCamelCase(case3);

		assert.strictEqual(UpperCamelCase1, "HelloWorld");
		assert.strictEqual(UpperCamelCase2, "HelloWorld");
		assert.strictEqual(UpperCamelCase3, "HelloWorld");
	}
	);
});
