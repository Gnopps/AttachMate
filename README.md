## AttachMate for Obsidian

### Intro

This is a plugin for [Obsidian](https://obsidian.md) that helps you when you drop attachments that Obsidian can't display natively (e.g. email messages dragged from Outlook). It offers two features:

1. **Remove preview of attachment from note**. This is done by removing the exclamation mark before the attachment, so it will be `[[attachment.msg]]` instead of `![[attachment.msg]]`

2. **Prompt for an alternative text to be displayed** (can be turned off in settings). Instead of the attachment being displayed as `[[RE RE latest update]]`, you can easily type in your own text, e.g. `[[RE RE latest update|email about ACME status]]` that will display instead of the attachment name.

![Example of completing a task](https://raw.githubusercontent.com/Gnopps/AttachMate/main/AttachMate.gif)

### Settings

In the settings it is possible to define what attachments to react to, by default these are `.msg` and `.eml`.
It is also possible to turn of the functionality for adding a display text for the attachment.
