import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

interface AttachMateSettings {
	fileExtensions: string;
	insertAltText: boolean;
}

const DEFAULT_SETTINGS: AttachMateSettings = {
	fileExtensions: "msg,eml",
	insertAltText: true,
};

export default class AttachMate extends Plugin {
	settings: AttachMateSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new settingTab(this.app, this));
		this.app.workspace.on("editor-drop", (evt, editor, data) => {
			const cursorPosition = editor.getCursor();

			// Extract the file name from the drop event
			let fileName = null;
			if (
				evt.dataTransfer &&
				evt.dataTransfer.files &&
				evt.dataTransfer.files.length > 0
			) {
				fileName = evt.dataTransfer.files[0].name;
			}

			// Check if the file name ends with the correct ending
			let foundRightEnding = false;
			if (this.settings.fileExtensions == "*") {
				foundRightEnding = true;
			} else {
				const endingsInSettings =
					this.settings.fileExtensions.split(",");
				for (let i = 0; i < endingsInSettings.length; i++) {
					if (fileName && fileName.endsWith(endingsInSettings[i])) {
						foundRightEnding = true;
						break;
					}
				}
			}
			if (!foundRightEnding) {
				return;
			}

			// Get the element that represents the editor content
			const editorElement = editor.containerEl;

			// Create a MutationObserver to watch for changes in the editor
			const observer = new MutationObserver((mutations) => {
				for (let mutation of mutations) {
					if (
						mutation.type === "childList" ||
						mutation.type === "characterData"
					) {
						// The drop has completed, execute code
						const lineText = editor.getLine(cursorPosition.line);

						// Split the line text into before and after the cursor position
						const beforeCursor = lineText.substring(
							0,
							cursorPosition.ch
						);
						const afterCursor = lineText.substring(
							cursorPosition.ch
						);

						// Perform the replacement only on the part after the cursor
						const modifiedAfterCursor = afterCursor.replace(
							"![[",
							"[["
						);

						// Combine the parts to form the modified line text
						const modifiedLineText =
							beforeCursor + modifiedAfterCursor;

						editor.setLine(cursorPosition.line, modifiedLineText);

						// Recalculate the line text and find the position of the newly created link
						const updatedLineText = editor.getLine(
							cursorPosition.line
						);
						const positionOfNewLink = updatedLineText.indexOf(
							"[[",
							cursorPosition.ch
						);

						const positionOfClosingBrackets =
							updatedLineText.indexOf("]]", positionOfNewLink);

						editor.focus();
						if (
							positionOfNewLink !== -1 &&
							positionOfClosingBrackets !== -1
						) {
							// Set the cursor to the position of the "]]" of the newly created link
							editor.setCursor({
								line: cursorPosition.line,
								ch: positionOfClosingBrackets,
							});
							editor.replaceRange(
								"|attachment",
								editor.getCursor()
							);

							// Set cursor within the newly added link
							setTimeout(() => {
								const newLineText = editor.getLine(
									cursorPosition.line
								);
								const positionOfDivider = newLineText.indexOf(
									"|attachment]]",
									positionOfNewLink
								);

								// Define the start and end positions of the selection
								const start = {
									line: cursorPosition.line,
									ch: positionOfDivider + 1,
								};
								const end = {
									line: cursorPosition.line,
									ch: positionOfDivider + 11, // +11 to match the word "attachment"
								};

								// Set the selection in CodeMirror
								editor.setSelection(start, end);
							}, 10);
						}

						// Stop observing after the change is detected and handled
						observer.disconnect();
						break;
					}
				}
			});

			// Configure the observer to watch for changes in child elements and text content
			observer.observe(editorElement, {
				childList: true,
				characterData: true,
				subtree: true,
			});
		});
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class settingTab extends PluginSettingTab {
	plugin: AttachMate;

	constructor(app: App, plugin: AttachMate) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("File endings to react to")
			.setDesc(
				"Enter the file endings to react to, separated by commas. Use * to react to all files."
			)
			.addText((text) =>
				text
					.setPlaceholder("msg,eml")
					.setValue(this.plugin.settings.fileExtensions)
					.onChange(async (value) => {
						this.plugin.settings.fileExtensions = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Insert alternative text")
			.setDesc(
				"Automatically move cursor to be able to enter display name"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.insertAltText)
					.onChange(async (value) => {
						this.plugin.settings.insertAltText = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
