"use strict";

import Shell from "gi://Shell";
import Gio from "gi://Gio";
import GObject from "gi://GObject";

import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as QuickSettings from "resource:///org/gnome/shell/ui/quickSettings.js";
import * as Util from "resource:///org/gnome/shell/misc/util.js";
import St from "gi://St";
import * as Menu_Items from "./lib/menu_items.js";

import { Extension, gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";
import { PopupAnimation } from "resource:///org/gnome/shell/ui/boxpointer.js";
import * as Config from "resource:///org/gnome/shell/misc/config.js";

const ShellVersion = parseFloat(Config.PACKAGE_VERSION);
const QuickSettingsMenu = Main.panel.statusArea.quickSettings;

function closeQuickSettingsMenu() {
    if (ShellVersion > 50) QuickSettingsMenu.menu.close({ fadeOnly: true });
    else QuickSettingsMenu.menu.close(PopupAnimation.FADE);
}

function launchItem(settingItem) {
    if (settingItem["cmd"].match(/\.desktop$/)) {
        const app = Shell.AppSystem.get_default().lookup_app(settingItem["cmd"]);

        if (app !== null) app.activate();
        else if (settingItem["cmd-alt"] !== null) Util.spawn([settingItem["cmd-alt"]]);
    } else {
        Util.spawnCommandLine(settingItem["cmd"]);
    }

    closeQuickSettingsMenu();
}

const SettingsCenterActionButton = GObject.registerClass(
    // The matching class name is intentional for GObject registration.
    // eslint-disable-next-line no-shadow
    class SettingsCenterActionButton extends QuickSettings.QuickSettingsItem {
        constructor(extension) {
            const { _settings } = extension;
            const labelmenu = _(_settings.get_string("label-menu"));
            super({
                style_class: "icon-button",
                can_focus: true,
                icon_name: "preferences-other-symbolic",
                accessible_name: labelmenu,
                visible: Main.sessionMode.allowSettings,
            });

            this.menu = new PopupMenu.PopupMenu(this, 0.5, St.Side.TOP);
            Main.uiGroup.add_child(this.menu.actor);
            this.menu.actor.hide();
            this._menuManager = new PopupMenu.PopupMenuManager(this);
            this._menuManager.addMenu(this.menu);

            try {
                const menuItems = new Menu_Items.MenuItems(_settings);
                this._items = menuItems.getEnableItems();

                if (this._items.length > 0) {
                    for (const item of this._items) {
                        let strIcon,
                            strLabel = null;
                        if (item["cmd"].match(/\.desktop$/)) {
                            const app = Shell.AppSystem.get_default().lookup_app(item["cmd"]);
                            if (app !== null) {
                                strLabel = app.get_name();
                                strIcon = app.icon.to_string();
                            }
                        }
                        const menuItem = new PopupMenu.PopupImageMenuItem(
                            strLabel || item.label,
                            strIcon || "image-missing-symbolic"
                        );
                        menuItem.connect("activate", () => launchItem(item));
                        this.menu.addMenuItem(menuItem);
                    }
                }

                this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
                const settingsItem = this.menu.addAction(_("Preferences"), () => {
                    extension.openPreferences();
                    closeQuickSettingsMenu();
                });

                settingsItem.visible = Main.sessionMode.allowSettings;
                this.menu._settingsActions[extension.uuid] = settingsItem;
            } catch (error) {
                extension.getLogger().error(`Error in SettingsCenterActionButton constructor: ${error}`);
            }

            this.connect("clicked", () => this.menu.toggle());
            this._quickSettingsCloseId = QuickSettingsMenu.menu.connect("open-state-changed", (_menu, isOpen) => {
                if (!isOpen) this.menu.close(PopupAnimation.NONE);
            });
            Main.sessionMode.connectObject(
                "updated",
                () => {
                    this.visible = Main.sessionMode.allowSettings;
                },
                this
            );
        }

        destroy() {
            QuickSettingsMenu.menu.disconnect(this._quickSettingsCloseId);
            this.menu.destroy();
            this._menuManager = null;
            super.destroy();
        }
    }
);

const SettingsCenterMenuToggle = GObject.registerClass(
    // The matching class name is intentional for GObject registration.
    // eslint-disable-next-line no-shadow
    class SettingsCenterMenuToggle extends QuickSettings.QuickMenuToggle {
        constructor(extension) {
            const { _settings } = extension;
            const labelmenu = _(_settings.get_string("label-menu"));
            super({
                title: labelmenu,
                iconName: "preferences-other-symbolic",
                toggleMode: true,
            });

            this.menu.setHeader("preferences-other-symbolic", labelmenu, "");

            _settings.bind("show-systemindicator", this, "checked", Gio.SettingsBindFlags.DEFAULT);

            try {
                const menuItems = new Menu_Items.MenuItems(_settings);
                this._items = menuItems.getEnableItems();

                if (this._items.length > 0) {
                    for (const [index, item] of this._items.entries()) {
                        let strIcon,
                            strLabel = null;
                        if (item["cmd"].match(/\.desktop$/)) {
                            const app = Shell.AppSystem.get_default().lookup_app(item["cmd"]);
                            if (app !== null) {
                                strLabel = app.get_name();
                                strIcon = app.icon.to_string();
                            }
                        }
                        const menuItem = new PopupMenu.PopupImageMenuItem(
                            strLabel || item.label,
                            strIcon || "image-missing-symbolic"
                        );
                        menuItem.connect("activate", () => launchItem(item));
                        this.menu.addMenuItem(menuItem, index);
                    }
                }

                this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
                const settingsItem = this.menu.addAction(_("Settings"), () => {
                    extension.openPreferences();
                    closeQuickSettingsMenu();
                });

                settingsItem.visible = Main.sessionMode.allowSettings;
                this.menu._settingsActions[extension.uuid] = settingsItem;
            } catch (error) {
                extension.getLogger().error(`Error in SettingsCenterMenuToggle constructor: ${error}`);
            }
        }
    }
);

const SettingsCenterIndicator = GObject.registerClass(
    // The matching class name is intentional for GObject registration.
    // eslint-disable-next-line no-shadow
    class SettingsCenterIndicator extends QuickSettings.SystemIndicator {
        constructor(extension) {
            const { _settings } = extension;
            super();
            // Create the icon for the indicator
            this._indicator = this._addIndicator();
            this._indicator.icon_name = "preferences-other-symbolic";
            this._indicator.visible = _settings.get_boolean("show-systemindicator");

            const appearance = _settings.get_string("quick-settings-appearance");
            if (appearance === "button") this._addActionButton(extension);
            else this._addQuickSettingsToggle(extension);

            QuickSettingsMenu._indicators.insert_child_at_index(this, 0);
            QuickSettingsMenu.addExternalIndicator(this);
        }

        _addQuickSettingsToggle(extension) {
            const quickSettingsToggle = new SettingsCenterMenuToggle(extension);
            this.quickSettingsItems.push(quickSettingsToggle);
        }

        _addActionButton(extension) {
            const actionRow = QuickSettingsMenu?._system?._systemItem?.child;
            if (!actionRow) return;

            this._actionButton = new SettingsCenterActionButton(extension);
            const actionItems = actionRow.get_children();
            const settingsIndex = actionItems.findIndex(
                (child) => child._settingsApp?.get_id() === "org.gnome.Settings.desktop"
            );
            if (settingsIndex >= 0) actionRow.insert_child_at_index(this._actionButton, settingsIndex);
            else actionRow.add_child(this._actionButton);
        }

        setIndicatorVisible(visible) {
            this._indicator.visible = visible;
        }

        destroy() {
            this._actionButton?.destroy();
            this._actionButton = null;

            for (const item of this.quickSettingsItems) {
                item.destroy();
            }

            super.destroy();
        }
    }
);

export default class SettingsCenter extends Extension {
    _onParamChanged() {
        this.disable();
        this.enable();
    }

    _onParamChangedIndicator() {
        this._indicator.setIndicatorVisible(this._settings.get_boolean("show-systemindicator"));
    }

    enable() {
        this._settings = this.getSettings();
        this._settingSignals = [];
        this._indicator = new SettingsCenterIndicator(this);

        const settingsToMonitor = [
            { key: "label-menu", callback: this._onParamChanged.bind(this) },
            {
                key: "show-systemindicator",
                callback: this._onParamChangedIndicator.bind(this),
            },
            {
                key: "quick-settings-appearance",
                callback: this._onParamChanged.bind(this),
            },
            { key: "items", callback: this._onParamChanged.bind(this) },
        ];

        for (const setting of settingsToMonitor) {
            this._settingSignals.push(this._settings.connect(`changed::${setting.key}`, setting.callback));
        }
    }

    disable() {
        if (this._settingSignals && this._settings) {
            for (const signal of this._settingSignals) {
                this._settings.disconnect(signal);
            }
        }
        this._settingSignals = null;

        this._indicator?.destroy();
        this._indicator = null;
        this._settings = null;
    }
}
