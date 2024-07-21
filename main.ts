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

		this.registerEvent(
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

				// Check if the file name ends with ending we should take action on
				let foundRightEnding = false;
				const endingsInSettings =
					this.settings.fileExtensions.split(",");
				for (let i = 0; i < endingsInSettings.length; i++) {
					if (fileName && fileName.endsWith(endingsInSettings[i])) {
						foundRightEnding = true;
						break;
					}
				}
				if (foundRightEnding == false) {
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
							// The drop has completed, execute your code
							const lineText = editor.getLine(
								cursorPosition.line
							);

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

							editor.setLine(
								cursorPosition.line,
								modifiedLineText
							);

							// Check if we should move cursor to insert alternative text
							if (this.settings.insertAltText == true) {
								// Find the position of "]]" in the modified line text
								const positionOfClosingBrackets =
									modifiedLineText.indexOf("]]");
								editor.focus();
								if (positionOfClosingBrackets !== -1) {
									// Set the cursor to the position of "]]"
									editor.setCursor({
										line: cursorPosition.line,
										ch: positionOfClosingBrackets,
									});
									editor.replaceRange(
										"|attachment",
										editor.getCursor()
									);
									setTimeout(() => {
										const newLineText = editor.getLine(
											cursorPosition.line
										);

										const positionOfDivider =
											newLineText.indexOf(
												"|attachment]]"
											);

										// Define the start and end positions of the selection
										const start = {
											line: cursorPosition.line,
											ch: positionOfDivider + 1,
										};
										const end = {
											line: cursorPosition.line,
											ch: positionOfDivider + 11, //+11 to match the word "attachment"
										};

										// Set the selection in CodeMirror
										editor.setSelection(start, end);
									}, 100);
								}
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
			})
		);
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
			.setDesc("Enter the file endings to react to, separated by commas")
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
