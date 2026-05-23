# AGENTS.md

Guidance for coding agents working in this repository.

## Project

SettingsCenter is a GNOME Shell extension that adds a customizable quick settings menu for launching settings tools and apps.

The extension UUID is `SettingsCenter@lauinger-clan.de`.

Current target shell versions are declared in `SettingsCenter@lauinger-clan.de/metadata.json`. Keep compatibility with all declared versions unless the user explicitly changes the target.

## Repository Map

- `SettingsCenter@lauinger-clan.de/extension.js`: GNOME Shell runtime code. Builds the quick settings indicator and launches configured items.
- `SettingsCenter@lauinger-clan.de/prefs.js`: libadwaita/GTK preferences window. Manages label, system indicator toggle, app chooser, item add/delete/enable/reorder UI.
- `SettingsCenter@lauinger-clan.de/lib/menu_items.js`: GSettings-backed menu item model and serialization helpers.
- `SettingsCenter@lauinger-clan.de/schemas/org.gnome.shell.extensions.SettingsCenter.gschema.xml`: GSettings schema and default menu item string.
- `SettingsCenter@lauinger-clan.de/ui/prefs.ui`: GtkBuilder UI for static preferences pages.
- `po/`: translations.
- `settingscenter.sh`: helper script for pack/install/upload/translation updates.
- `eslint.config.js`: ESLint 9 flat config.

## Development Notes

- This is GJS ES module code. Prefer GNOME/GJS APIs and existing local patterns.
- Runtime Shell code may use GNOME Shell private modules. Check compatibility carefully across every shell version listed in `metadata.json`.
- Preferences code uses GTK4/libadwaita and should avoid Shell-only APIs.
- For GI imports where multiple major versions can exist, prefer explicit versions when practical, for example `gi://Gdk?version=4.0`.
- Preserve user changes. The worktree may contain staged or unstaged edits unrelated to your task.

## Menu Item Storage

Menu items are stored in GSettings key `items` as a single serialized string:

```text
label;cmd;enable;cmd-alt|label;cmd;enable;cmd-alt
```

Be careful with parsing and writing this format. Labels or commands containing `;` or `|` will currently break the format.

## Validation

Useful checks:

```sh
node --check SettingsCenter@lauinger-clan.de/prefs.js
node --check SettingsCenter@lauinger-clan.de/extension.js
npm run lint
```

`npm run lint` requires ESLint 9. If the system picks up ESLint 6, install/use the project dependencies before trusting lint output.

Packaging and install helpers:

```sh
./settingscenter.sh pack
./settingscenter.sh install
./settingscenter.sh translate
```

Do not upload releases unless the user explicitly asks.

## Translations

If a change adds, removes, or edits user-visible strings wrapped for translation, remind the user to run:

```sh
./settingscenter.sh translate
```

Do not update translations automatically unless the user asks, because it may touch many `po/` files.

## Testing Checklist

For preferences changes:

- Open the preferences window without console errors.
- Add a `.desktop` app through the app chooser.
- Add a plain command manually.
- Enable/disable an item.
- Delete an item.
- Reorder items and reopen preferences to confirm persistence.
- Confirm the quick settings menu reflects the saved order and enabled state.

For runtime extension changes:

- Enable and disable the extension cleanly.
- Toggle `show-systemindicator`.
- Change `label-menu` and confirm the quick settings UI updates.
- Launch both `.desktop` items and command items.

When compatibility matters, test on every GNOME Shell version declared in `metadata.json`.

## Common Gotchas

- `.desktop` matching should use an escaped dot, for example `/\.desktop$/`.
- Bounds checks should reject indexes with `index < 0 || index >= items.length`.
- Avoid assuming `_settings`, `_settingSignals`, or `_indicator` are initialized during teardown unless the code guarantees it.
