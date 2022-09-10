/* original author Xes. 3.6/3.8 fork l300lvl. replace system settings menu credit: IsacDaavid */

const { Gio, GObject, St } = imports.gi;
const Config = imports.misc.config;
const Main = imports.ui.main;
const Shell = imports.gi.Shell;
const PopupMenu = imports.ui.popupMenu;
const QuickSettings = imports.ui.quickSettings;
const QuickSettingsMenu = imports.ui.main.panel.statusArea.quickSettings;
const Util = imports.misc.util;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const MenuItems = Extension.imports.menu_items;
const g_schema = "org.gnome.shell.extensions.SettingsCenter";

const SettingsCenterMenuToggle = GObject.registerClass(
  class SettingsCenterMenuToggle extends QuickSettings.QuickMenuToggle {
    _init() {
      this._settings = ExtensionUtils.getSettings(g_schema);
      super._init({
        label: this._settings.get_string("label-menu"),
        iconName: "preferences-other-symbolic",
        toggleMode: true,
      });

      // This function is unique to this class. It adds a nice header with an
      // icon, title and optional subtitle. It's recommended you do so for
      // consistency with other menus.
      this.menu.setHeader(
        "preferences-other-symbolic",
        this._settings.get_string("label-menu"),
        ""
      );

      // You may also add sections of items to the menu
      let menuItems = new MenuItems.MenuItems(this._settings);
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
      const settingsItem = this.menu.addAction("More Settings", () =>
        ExtensionUtils.openPrefs()
      );

      // Ensure the settings are unavailable when the screen is locked
      settingsItem.visible = Main.sessionMode.allowSettings;
      this.menu._settingsActions[Extension.uuid] = settingsItem;
    }

    launch(settingItem) {
      if (settingItem["cmd"].match(/.desktop$/)) {
        let app = Shell.AppSystem.get_default().lookup_app(settingItem["cmd"]);

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
    _init() {
      super._init();

      // Create the icon for the indicator
      this._indicator = this._addIndicator();
      this._indicator.icon_name = "selection-mode-symbolic";

      // Create the toggle menu and associate it with the indicator, being
      // sure to destroy it along with the indicator
      this.quickSettingsItems.push(new SettingsCenterMenuToggle());

      this.connect("destroy", () => {
        this.quickSettingsItems.forEach((item) => item.destroy());
      });

      // Add the indicator to the panel and the toggle to the menu
      QuickSettingsMenu._indicators.add_child(this);
      QuickSettingsMenu._addItems(this.quickSettingsItems);
    }
  }
);

function isSupported() {
  let current_version = Config.PACKAGE_VERSION.split(".");
  return current_version[0] >= 43 ? true : false;
}

class SettingsCenter {
  constructor() {
    this._indicator = null;
  }

  onPreferencesActivate() {
    let app = Shell.AppSystem.get_default().lookup_app(
      "gnome-control-center.desktop"
    );
    app.activate();
  }

  onParamChanged() {
    this.disable();
    this.enable();
  }

  enable() {
    if (!isSupported()) {
      return;
    }
<<<<<<< HEAD

    this.settings = ExtensionUtils.getSettings(this.schema);

    this.settingSignals = new Array();
=======
    this._settings = ExtensionUtils.getSettings(g_schema);
>>>>>>> 0ea7a20... gnome 43

    this._settingSignals = new Array();

    this._indicator = new SettingsCenterIndicator();

    this._settingSignals.push(
      this._settings.connect(
        "changed::label-menu",
        this.onParamChanged.bind(this)
      )
    );
    this._settingSignals.push(
      this._settings.connect("changed::items", this.onParamChanged.bind(this))
    );
  }

  disable() {
    if (!isSupported()) {
      return;
    }
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

function init() {
  return new SettingsCenter();
}
