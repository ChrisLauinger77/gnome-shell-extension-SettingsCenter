import Gtk from "gi://Gtk";
import Gio from "gi://Gio";
import Adw from "gi://Adw";
import GObject from "gi://GObject";
import * as Menu_Items from "./menu_items.js";
import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

const errorLog = (...args) => {
  console.error("[SettingsCenter]", "Error:", ...args);
};

const handleError = (error) => {
  errorLog(error);
  return null;
};

export default class AdwPrefs extends ExtensionPreferences {
  _changeMenu(text) {
    this.getSettings.set_string("label-menu", text.text);
  }

  _changeEnable(menuItems, index, valueList) {
    menuItems.changeEnable(index, Number(valueList.active));
  }

  _addCmd(menuItems, page2, label, cmd) {
    if (label.text.trim() == "" || cmd.text.trim() == "") {
      log(
        _("SettingsCenter") +
          " " +
          _("'Label' and 'Command' must be filled out !")
      );
      return;
    }
    menuItems.addItem(label.text, cmd.text);

    label.text = "";
    cmd.text = "";

    this._buildList(menuItems, page2);
  }

  _changeOrder(menuItems, page2, index, order) {
    menuItems.changeOrder(index, order);

    this._buildList(menuItems, page2);
  }

  _delCmd(menuItems, page2, index) {
    const dialog = Adw.MessageDialog.new(
      page2.get_root(),
      _("Delete entry"),
      _("Are you sure you want to delete the entry ?")
    );
    dialog.add_response("cancel", _("Cancel"));
    dialog.add_response("delete", _("Delete"));
    dialog.set_response_appearance(
      "delete",
      Adw.ResponseAppearance.DESTRUCTIVE
    );

    dialog.connect("response", (self, response) => {
      if (response === "cancel") return;

      menuItems.delItem(index);
      this._buildList(menuItems, page2);
    });

    dialog.present();
  }

  _buttonUp(menuItems, page2, indexItem) {
    const buttonUp = new Gtk.Button({
      label: _("Up"),
      valign: Gtk.Align.CENTER,
    });
    buttonUp.set_icon_name("go-up-symbolic");
    if (indexItem > 0) {
      buttonUp.connect(
        "clicked",
        this._changeOrder.bind(this, menuItems, page2, indexItem, -1)
      );
      buttonUp.set_sensitive(true);
    } else {
      buttonUp.set_sensitive(false);
    }
    return buttonUp;
  }

  _buttonDown(menuItems, page2, indexItem, itemslen) {
    const buttonDown = new Gtk.Button({
      label: _("Down"),
      valign: Gtk.Align.CENTER,
    });
    buttonDown.set_icon_name("go-down-symbolic");
    if (indexItem < itemslen - 1) {
      buttonDown.connect(
        "clicked",
        this._changeOrder.bind(this, menuItems, page2, indexItem, 1)
      );
      buttonDown.set_sensitive(true);
    } else {
      buttonDown.set_sensitive(false);
    }
    return buttonDown;
  }

  _buttonDel(menuItems, page2, indexItem, itemslen) {
    let buttonDel = null;
    if (itemslen > 1) {
      buttonDel = new Gtk.Button({
        css_classes: ["destructive-action"],
        label: _("Del"),
        valign: Gtk.Align.CENTER,
        margin_start: 10,
      });
      buttonDel.set_icon_name("user-trash-symbolic");
      buttonDel.connect(
        "clicked",
        this._delCmd.bind(this, menuItems, page2, indexItem)
      );
    }
    return buttonDel;
  }

  _valueList(menuItems, indexItem, item) {
    const valueList = new Gtk.Switch({
      active: item["enable"] == "1",
      valign: Gtk.Align.CENTER,
    });
    valueList.connect(
      "notify::active",
      this._changeEnable.bind(this, menuItems, indexItem, valueList)
    );
    return valueList;
  }

  _buildList(menuItems, page2) {
    if (page2._group3 !== null) {
      page2.remove(page2._group3);
    }
    const group3 = Adw.PreferencesGroup.new();
    group3.set_title(_("Menu Items"));
    group3.set_name("settingscenter_menuitems");
    page2.add(group3);
    page2._group3 = group3;
    let items = menuItems.getItems();

    for (let indexItem in items) {
      let item = items[indexItem];
      const adwrow = new Adw.ActionRow({ title: _(item["label"]) });
      adwrow.set_tooltip_text(item["cmd"]);
      group3.add(adwrow);
      const buttonUp = this._buttonUp(menuItems, page2, indexItem);
      const buttonDown = this._buttonDown(
        menuItems,
        page2,
        indexItem,
        items.length
      );
      const valueList = this._valueList(menuItems, indexItem, item);
      const buttonDel = this._buttonDel(
        menuItems,
        page2,
        indexItem,
        items.length
      );
      adwrow.add_suffix(valueList);
      adwrow.activatable_widget = valueList;
      adwrow.add_suffix(buttonUp);
      adwrow.add_suffix(buttonDown);
      if (buttonDel != null) adwrow.add_suffix(buttonDel);
    }
  }

  _getFilename(fullPath) {
    log("_getFilename fullPath: " + fullPath);
    return fullPath.replace(/^.*[\\/]/, "");
  }

  fillPreferencesWindow(window) {
    window._settings = this.getSettings();
    const menuItems = new Menu_Items.MenuItems(window._settings);
    let adwrow;
    const page1 = Adw.PreferencesPage.new();
    page1.set_title(_("Settings"));
    page1.set_name("settingscenter_page1");
    page1.set_icon_name("preferences-system-symbolic");

    let myAppChooser = new AppChooser({
      title: _("Select app"),
      modal: true,
      transient_for: page1.get_root(),
      hide_on_close: true,
      width_request: 300,
      height_request: 600,
      resizable: false,
    });

    // group1
    const group1 = Adw.PreferencesGroup.new();
    group1.set_title(_("Global"));
    group1.set_name("settingscenter_global");
    page1.add(group1);
    adwrow = new Adw.ActionRow({ title: _("Menu Label") });
    group1.add(adwrow);
    const valueMenu = new Gtk.Entry({
      hexpand: true,
      valign: Gtk.Align.CENTER,
    });

    valueMenu.set_text(_(window._settings.get_string("label-menu")));
    const buttonMenu = new Gtk.Button({
      label: _("Apply"),
      css_classes: ["suggested-action"],
      valign: Gtk.Align.CENTER,
    });
    buttonMenu.connect("clicked", this._changeMenu.bind(this, valueMenu));
    adwrow.add_suffix(valueMenu);
    adwrow.add_suffix(buttonMenu);
    adwrow.activatable_widget = buttonMenu;

    adwrow = new Adw.ActionRow({ title: _("Show SystemIndicator") });
    adwrow.set_tooltip_text(_("Toggle to show systemindicator"));
    group1.add(adwrow);
    const systemindicator_switch = new Gtk.Switch({
      active: window._settings.get_boolean("show-systemindicator"),
      valign: Gtk.Align.CENTER,
    });
    window._settings.bind(
      "show-systemindicator",
      systemindicator_switch,
      "active",
      Gio.SettingsBindFlags.DEFAULT
    );
    adwrow.add_suffix(systemindicator_switch);

    // group2
    const group2 = Adw.PreferencesGroup.new();
    group2.set_title(_("Add Menu"));
    group2.set_name("settingscenter_addmenu");
    page1.add(group2);
    adwrow = new Adw.ActionRow({ title: _("Label") });
    adwrow.set_tooltip_text(_("Label to show in menu"));
    group2.add(adwrow);
    const valueLabelAdd = new Gtk.Entry({
      hexpand: true,
      valign: Gtk.Align.CENTER,
    });
    adwrow.add_suffix(valueLabelAdd);
    adwrow = new Adw.ActionRow({ title: _("Command") });
    adwrow.set_tooltip_text(
      _("Name of .desktop file (MyApp.desktop) or name of command")
    );
    group2.add(adwrow);
    const valueCmdAdd = new Gtk.Entry({
      hexpand: true,
      valign: Gtk.Align.CENTER,
    });
    adwrow.add_suffix(valueCmdAdd);
    adwrow = new Adw.ActionRow({ title: "" });
    group2.add(adwrow);
    const buttonfilechooser = new Gtk.Button({
      label: _("Select app"),
      valign: Gtk.Align.CENTER,
    });
    buttonfilechooser.set_tooltip_text(
      _("Usually located in '/usr/share/applications'")
    );
    adwrow.add_suffix(buttonfilechooser);
    adwrow.activatable_widget = buttonfilechooser;

    buttonfilechooser.connect("clicked", async () => {
      const appRow = await myAppChooser.showChooser().catch(handleError);
      if (appRow !== null) {
        valueLabelAdd.set_text(appRow.title);
        valueCmdAdd.set_text(appRow.subtitle);
      }
    });

    const buttonAdd = new Gtk.Button({
      label: _("Add"),
      css_classes: ["suggested-action"],
      valign: Gtk.Align.CENTER,
    });
    //page2
    const page2 = Adw.PreferencesPage.new();
    page2.set_title(_("Settings Center"));
    page2.set_name("settingscenter_page2");
    page2.set_icon_name("preferences-other-symbolic");

    buttonAdd.connect(
      "clicked",
      this._addCmd.bind(this, menuItems, page2, valueLabelAdd, valueCmdAdd)
    );
    buttonAdd.set_tooltip_text(_("'Label' and 'Command' must be filled out !"));
    adwrow.add_suffix(buttonAdd);
    adwrow.activatable_widget = buttonAdd;
    // group3
    page2._group3 = null;
    this._buildList(menuItems, page2);
    window.set_default_size(675, 655);
    window.add(page1);
    window.add(page2);
  }
}

const AppChooser = GObject.registerClass(
  class AppChooser extends Adw.Window {
    _init(params = {}) {
      super._init(params);
      let adwtoolbarview = new Adw.ToolbarView();
      let adwheaderbar = new Adw.HeaderBar();
      adwtoolbarview.add_top_bar(adwheaderbar);
      this.set_content(adwtoolbarview);
      let scrolledwindow = new Gtk.ScrolledWindow();
      adwtoolbarview.set_content(scrolledwindow);
      this.listBox = new Gtk.ListBox({
        selection_mode: Gtk.SelectionMode.SINGLE,
      });
      scrolledwindow.set_child(this.listBox);
      this.selectBtn = new Gtk.Button({
        label: _("Select"),
        css_classes: ["suggested-action"],
      });
      this.cancelBtn = new Gtk.Button({ label: _("Cancel") });
      adwheaderbar.pack_start(this.cancelBtn);
      adwheaderbar.pack_end(this.selectBtn);
      const apps = Gio.AppInfo.get_all();

      for (const app of apps) {
        if (app.should_show() === false) continue;
        const row = new Adw.ActionRow();
        row.title = app.get_display_name();
        row.subtitle = app.get_id();
        row.subtitleLines = 1;
        const icon = new Gtk.Image({ gicon: app.get_icon() });
        row.add_prefix(icon);
        this.listBox.append(row);
      }

      this.cancelBtn.connect("clicked", () => {
        this.close();
      });
    }

    showChooser() {
      return new Promise((resolve) => {
        const signalId = this.selectBtn.connect("clicked", () => {
          this.close();
          this.selectBtn.disconnect(signalId);
          const row = this.listBox.get_selected_row();
          resolve(row);
        });
        this.present();
      });
    }
  }
);
