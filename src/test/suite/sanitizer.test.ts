import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { sanitize } from '../../utils/sanitizeBranch';
// import * as myExtension from '../../extension';

suite('Branch Sanitizer', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('branch sanitize', () => {
		const testBranch = "[This] is a .. task !\"name\" '* ^@.lock";
		const expected = "This-is-a---task-name--lock";

		assert.strictEqual(sanitize(testBranch), expected);
	});
});
