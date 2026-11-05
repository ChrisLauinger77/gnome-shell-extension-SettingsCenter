# AGENTS.md

Guidance for coding agents working in this repository.

## Project

SettingsCenter is a GNOME Shell extension that adds a customizable quick settings menu for launching settings tools and apps.

The extension UUID is `SettingsCenter@lauinger-clan.de`.

Current target shell versions are declared in `SettingsCenter@lauinger-clan.de/metadata.json`. Keep compatibility with all declared versions unless the user explicitly changes the target.

## Repository Map

- `SettingsCenter@lauinger-clan.de/extension.js`: GNOME Shell runtime code. Builds the quick settings indicator (as a menu toggle or a system action row button) and launches configured items.
- `SettingsCenter@lauinger-clan.de/prefs.js`: libadwaita/GTK preferences window. Manages label, system indicator toggle, quick settings appearance, GNOME Settings button visibility, app chooser, item add/delete/enable/drag-and-drop reorder UI, and settings reset.
- `SettingsCenter@lauinger-clan.de/lib/menu_items.js`: GSettings-backed menu item model and serialization helpers.
- `SettingsCenter@lauinger-clan.de/schemas/org.gnome.shell.extensions.SettingsCenter.gschema.xml`: GSettings schema and default menu item string.
- `SettingsCenter@lauinger-clan.de/ui/prefs.ui`: GtkBuilder UI for static preferences pages.
- `SettingsCenter@lauinger-clan.de/stylesheet.css`: preferences styles (drag-and-drop row highlight), loaded by `prefs.js`.
- `po/`: translations.
- `settingscenter.sh`: helper script for dependency install, pack/install/upload, translation updates, and version checks.
- `.githooks/`: Git hooks that keep `package.json` version in sync with `metadata.json` `version-name`.
- `eslint.config.js`: ESLint flat config.

## Development Notes

- This is GJS ES module code. Prefer GNOME/GJS APIs and existing local patterns.
- Runtime Shell code may use GNOME Shell private modules. Check compatibility carefully across every shell version listed in `metadata.json`.
- Preferences code uses GTK4/libadwaita and should avoid Shell-only APIs.
- Preserve user changes. The worktree may contain staged or unstaged edits unrelated to your task.
- Use `$review-gnome-shell-extension` before changing runtime, preferences, metadata, schema, packaging, or user-data behavior that may affect extensions.gnome.org review.

## Useful Commands

- `./settingscenter.sh install-dependencies`: install the locked JavaScript dependencies.
- `npm run lint`: run ESLint.
- `./settingscenter.sh pack`: build `SettingsCenter@lauinger-clan.de.shell-extension.zip` (`cleanup` removes it).
- `./settingscenter.sh translate`: regenerate `po/SettingsCenter.pot` and merge into `po/*.po`.
- `./settingscenter.sh check-version` / `update-version`: verify or sync `package.json` version against `metadata.json` `version-name`.
- `./settingscenter.sh setup-hooks`: enable the hooks in `.githooks/`.

Run `./settingscenter.sh install-dependencies` after pulling or rebasing remote
changes that modify `package-lock.json`, particularly Renovate updates.

## Menu Item Storage

Menu items are stored in GSettings key `items` as a single serialized string:

```text
v2:|label;cmd;enable;cmd-alt|label;cmd;enable;cmd-alt
```

`lib/menu_items.js` writes the `v2:|` format, with each field URI-encoded (`encodeURIComponent`) so `;` and `|` in labels or commands are safe. It still reads the legacy unprefixed, unencoded format (used by the schema default), so keep both parsing paths working. `enable` is `1` or `0`.

## Validation Checklist

Before finishing changes, run the validations that match the edit:

- JavaScript changes: run `node --check` on each changed JavaScript file and `npm run lint`.
- Schema, metadata, packaging, icon, UI, or translation changes: `./settingscenter.sh pack`.
- User-visible strings: `./settingscenter.sh translate`.
- Runtime behavior: load the extension in GNOME Shell and check both the quick
  settings menu and preferences window.
- Submission-oriented changes: use `$review-gnome-shell-extension` to check
  lifecycle cleanup, process boundaries, metadata, schemas, privacy, and
  packaging requirements.

`npm run lint` uses the ESLint version from `package.json` (currently ESLint 10). If a global, older ESLint is picked up, run `./settingscenter.sh install-dependencies` before trusting lint output.

If a required GNOME or gettext command is unavailable in the environment, state that clearly in the final response.

Do not install or upload releases unless the user explicitly asks.

## Translations

If a change adds, removes, or edits user-visible strings wrapped for translation, remind the user to run:

```sh
./settingscenter.sh translate
```

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
- Switch `quick-settings-appearance` between `toggle` and `button`.
- Toggle `hide-system-settings-button` and confirm the GNOME Settings button is restored on disable.
- Change `label-menu` and confirm the quick settings UI updates.
- Launch both `.desktop` items and command items.

When compatibility matters, test on every GNOME Shell version declared in `metadata.json`.

## Common Gotchas

- `.desktop` matching should use an escaped dot, for example `/\.desktop$/`.
- Bounds checks should reject indexes with `index < 0 || index >= items.length`.
- Avoid assuming `_settings`, `_settingSignals`, or `_indicator` are initialized during teardown unless the code guarantees it.
