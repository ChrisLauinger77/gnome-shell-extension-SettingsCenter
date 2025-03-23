import Shell from "gi://Shell";
import Gio from "gi://Gio";
import GObject from "gi://GObject";

import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as QuickSettings from "resource:///org/gnome/shell/ui/quickSettings.js";
import * as Util from "resource:///org/gnome/shell/misc/util.js";
import * as Menu_Items from "./menu_items.js";
import { PopupAnimation } from "resource:///org/gnome/shell/ui/boxpointer.js";

import {
    Extension,
    gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";

const QuickSettingsMenu = Main.panel.statusArea.quickSettings;

const SettingsCenterMenuToggle = GObject.registerClass(
    class SettingsCenterMenuToggle extends QuickSettings.QuickMenuToggle {
        constructor(Me) {
            const { _settings } = Me;
            super({
                title: _(_settings.get_string("label-menu")),
                iconName: "preferences-other-symbolic",
                toggleMode: true,
            });

            this.menu.setHeader(
                "preferences-other-symbolic",
                _(_settings.get_string("label-menu")),
                ""
            );

            _settings.bind(
                "show-systemindicator",
                this,
                "checked",
                Gio.SettingsBindFlags.DEFAULT
            );

            try {
                const menuItems = new Menu_Items.MenuItems(_settings);
                this._items = menuItems.getEnableItems();

                if (this._items.length > 0) {
                    this._items.forEach((item, index) => {
                        const menuItem = new PopupMenu.PopupMenuItem(
                            _(item.label),
                            0
                        );
                        menuItem.connect("activate", () => this.launch(item));
                        this.menu.addMenuItem(menuItem, index);
                    });
                }

                this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
                const settingsItem = this.menu.addAction(_("Settings"), () =>
                    Me._openPreferences()
                );

                settingsItem.visible = Main.sessionMode.allowSettings;
                this.menu._settingsActions[Me.uuid] = settingsItem;
            } catch (error) {
                console.error(
                    `Error in SettingsCenterMenuToggle constructor: ${error}`
                );
            }
        }

        launch(settingItem) {
            if (settingItem["cmd"].match(/.desktop$/)) {
                let app = Shell.AppSystem.get_default().lookup_app(
                    settingItem["cmd"]
                );

                if (app !== null) app.activate();
                else if (settingItem["cmd-alt"] !== null)
                    Util.spawn([settingItem["cmd-alt"]]);
            } else {
                let cmdArray = settingItem["cmd"].split(" ");
                Util.spawn(cmdArray);
            }
            QuickSettingsMenu.menu.close(PopupAnimation.FADE);
        }
    }
);

const SettingsCenterIndicator = GObject.registerClass(
    class SettingsCenterIndicator extends QuickSettings.SystemIndicator {
        constructor(Me) {
            const { _settings } = Me;
            super();

            if (_settings.get_boolean("show-systemindicator")) {
                // Create the icon for the indicator
                this._indicator = this._addIndicator();
                this._indicator.icon_name = "preferences-other-symbolic";
            }

            // Create the toggle menu and associate it with the indicator, being
            // sure to destroy it along with the indicator
            this.quickSettingsItems.push(new SettingsCenterMenuToggle(Me));

            this.connect("destroy", () => {
                this.quickSettingsItems.forEach((item) => item.destroy());
            });

            // Add the indicator to the panel and the toggle to the menu
            QuickSettingsMenu._indicators.add_child(this);
            QuickSettingsMenu.addExternalIndicator(this);
        }
    }
);

export default class SettingsCenter extends Extension {
    onParamChanged() {
        this.disable();
        this.enable();
    }

    _openPreferences() {
        this.openPreferences();
        QuickSettingsMenu.menu.close(PopupAnimation.FADE);
    }

    enable() {
        this._settings = this.getSettings();
        this._settingSignals = [];
        this._indicator = new SettingsCenterIndicator(this);

        const settingsToWatch = ["label-menu", "show-systemindicator", "items"];

        settingsToWatch.forEach((setting) => {
            const signalId = this._settings.connect(
                `changed::${setting}`,
                this.onParamChanged.bind(this)
            );
            this._settingSignals.push(signalId);
        });
    }

    disable() {
        //Remove setting Signals
        this._settingSignals.forEach(function (signal) {
            this._settings.disconnect(signal);
        }, this);
        this._settingSignals = null;
        this._settings = null;

        this._indicator.destroy();
        this._indicator = null;
    }
}
