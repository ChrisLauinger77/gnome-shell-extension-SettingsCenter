import Shell from "gi://Shell";
import Gio from "gi://Gio";
import GObject from "gi://GObject";

import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as QuickSettings from "resource:///org/gnome/shell/ui/quickSettings.js";
import * as Util from "resource:///org/gnome/shell/misc/util.js";
import * as Menu_Items from "./menu_items.js";

import {
    Extension,
    gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";

const QuickSettingsMenu = Main.panel.statusArea.quickSettings;

const SettingsCenterMenuToggle = GObject.registerClass(
    class SettingsCenterMenuToggle extends QuickSettings.QuickMenuToggle {
        _init(settings, Me) {
            super._init({
                title: _(settings.get_string("label-menu")),
                iconName: "preferences-other-symbolic",
                toggleMode: true,
            });

            // This function is unique to this class. It adds a nice header with an
            // icon, title and optional subtitle. It's recommended you do so for
            // consistency with other menus.
            this.menu.setHeader(
                "preferences-other-symbolic",
                _(settings.get_string("label-menu")),
                ""
            );

            settings.bind(
                "show-systemindicator",
                this,
                "checked",
                Gio.SettingsBindFlags.DEFAULT
            );

            // You may also add sections of items to the menu
            let menuItems = new Menu_Items.MenuItems(settings);
            this._items = menuItems.getEnableItems();

            if (this._items.length > 0) {
                let i = 0;
                //Add others menus
                for (let indexItem in this._items) {
                    let menuItem = new PopupMenu.PopupMenuItem(
                        _(this._items[indexItem]["label"]),
                        0
                    );
                    menuItem.connect(
                        "activate",
                        this.launch.bind(this, this._items[indexItem])
                    );
                    this.menu.addMenuItem(menuItem, i++);
                }
            }
            // Add an entry-point for more settings
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            const settingsItem = this.menu.addAction(_("Settings"), () =>
                Me._openPreferences()
            );

            // Ensure the settings are unavailable when the screen is locked
            settingsItem.visible = Main.sessionMode.allowSettings;
            this.menu._settingsActions[Me.uuid] = settingsItem;
        }

        launch(settingItem) {
            if (settingItem["cmd"].match(/.desktop$/)) {
                let app = Shell.AppSystem.get_default().lookup_app(
                    settingItem["cmd"]
                );

                if (app != null) app.activate();
                else if (settingItem["cmd-alt"] != null)
                    Util.spawn([settingItem["cmd-alt"]]);
            } else {
                let cmdArray = settingItem["cmd"].split(" ");
                Util.spawn(cmdArray);
            }
        }
    }
);

const SettingsCenterIndicator = GObject.registerClass(
    class SettingsCenterIndicator extends QuickSettings.SystemIndicator {
        _init(settings, Me) {
            super._init();

            if (settings.get_boolean("show-systemindicator")) {
                // Create the icon for the indicator
                this._indicator = this._addIndicator();
                this._indicator.icon_name = "preferences-other-symbolic";
            }

            // Create the toggle menu and associate it with the indicator, being
            // sure to destroy it along with the indicator
            this.quickSettingsItems.push(
                new SettingsCenterMenuToggle(settings, Me)
            );

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
    }

    enable() {
        this._settings = this.getSettings();

        this._settingSignals = new Array();

        this._indicator = new SettingsCenterIndicator(this._settings, this);

        this._settingSignals.push(
            this._settings.connect(
                "changed::label-menu",
                this.onParamChanged.bind(this)
            )
        );
        this._settingSignals.push(
            this._settings.connect(
                "changed::show-systemindicator",
                this.onParamChanged.bind(this)
            )
        );
        this._settingSignals.push(
            this._settings.connect(
                "changed::items",
                this.onParamChanged.bind(this)
            )
        );
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
