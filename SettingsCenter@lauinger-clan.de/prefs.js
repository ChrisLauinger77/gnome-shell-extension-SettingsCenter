"use strict";

import Gtk from "gi://Gtk";
import Gio from "gi://Gio";
import Gdk from "gi://Gdk";
import Adw from "gi://Adw";
import GObject from "gi://GObject";
import * as Menu_Items from "./lib/menu_items.js";
import { ExtensionPreferences, gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

const AppChooser = GObject.registerClass(
    class AppChooser extends Adw.Window {
        constructor(params = {}) {
            super(params);
            const adwtoolbarview = new Adw.ToolbarView();
            const adwheaderbar = new Adw.HeaderBar();
            adwtoolbarview.add_top_bar(adwheaderbar);
            this.set_content(adwtoolbarview);

            const searchEntry = new Gtk.SearchEntry({
                placeholder_text: _("Search..."),
                hexpand: true,
            });
            adwheaderbar.set_title_widget(searchEntry);

            const scrolledwindow = new Gtk.ScrolledWindow();
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
            const apps = Gio.AppInfo.get_all()
                .filter((app) => app.should_show())
                .sort((a, b) => {
                    const nameA = a.get_display_name().toLowerCase();
                    const nameB = b.get_display_name().toLowerCase();
                    return nameA.localeCompare(nameB);
                });
            for (const app of apps) {
                if (app.should_show() === false) continue;
                const row = new Adw.ActionRow();
                row.title = app.get_display_name();
                row.subtitle = app.get_id();
                row._searchableText = app.get_display_name().toLowerCase() + " " + app.get_name().toLowerCase();
                row.subtitleLines = 1;
                const icon = new Gtk.Image({ gicon: app.get_icon() });
                row.add_prefix(icon);
                this.listBox.append(row);
            }
            const filterFunc = (row) => {
                const filterText = searchEntry.get_text().toLowerCase();
                if (!filterText) return true;
                return row._searchableText.includes(filterText);
            };
            this.listBox.set_filter_func(filterFunc);
            searchEntry.connect("search-changed", () => {
                this.listBox.invalidate_filter();
            });
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

export default class AdwPrefs extends ExtensionPreferences {
    _changeMenu(text) {
        this.getSettings().set_string("label-menu", text.get_text());
    }

    _changeEnable(menuItems, index, valueList) {
        menuItems.changeEnable(index, Number(valueList.active));
    }

    _addCmd(menuItems, page2, label, cmd) {
        if (label.text.trim() === "" || cmd.text.trim() === "") {
            this.getLogger().log(_("SettingsCenter") + " " + _("'Label' and 'Command' must be filled out !"));
            return;
        }
        menuItems.addItem(label.text, cmd.text);

        label.text = "";
        cmd.text = "";

        this._buildList(menuItems, page2);
    }

    _moveItem(menuItems, page2, fromIndex, toIndex) {
        if (fromIndex === toIndex) return;

        menuItems.changeOrder(fromIndex, toIndex - fromIndex);
        this._buildList(menuItems, page2);
    }

    _loadStylesheet() {
        if (this._stylesheetLoaded) return;

        const display = Gdk.Display.get_default();
        if (display === null) return;

        const provider = new Gtk.CssProvider();
        provider.load_from_path(`${this.path}/stylesheet.css`);
        Gtk.StyleContext.add_provider_for_display(
            display,
            provider,
            Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
        );
        this._stylesheetLoaded = true;
    }

    _dragHighlightRow(adwrow, active) {
        if (active) adwrow.add_css_class("drag_highlight_row");
        else adwrow.remove_css_class("drag_highlight_row");
    }

    _delCmd(menuItems, page2, index) {
        const dialog = Adw.MessageDialog.new(
            page2.get_root(),
            _("Delete entry"),
            _("Are you sure you want to delete the entry ?")
        );
        dialog.add_response("cancel", _("Cancel"));
        dialog.add_response("delete", _("Delete"));
        dialog.set_response_appearance("delete", Adw.ResponseAppearance.DESTRUCTIVE);

        dialog.connect("response", (self, response) => {
            if (response === "cancel") return;

            menuItems.delItem(index);
            this._buildList(menuItems, page2);
        });

        dialog.present();
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
            buttonDel.set_tooltip_text(_("Delete item"));
            buttonDel.connect("clicked", this._delCmd.bind(this, menuItems, page2, indexItem));
        }
        return buttonDel;
    }

    _valueList(menuItems, indexItem, item) {
        const valueList = new Gtk.Switch({
            active: item["enable"],
            valign: Gtk.Align.CENTER,
        });
        valueList.set_tooltip_text(_("Enable/Disable item"));
        valueList.connect("notify::active", this._changeEnable.bind(this, menuItems, indexItem, valueList));
        return valueList;
    }

    _addAppIcon(adwrow, appname) {
        const apps = Gio.AppInfo.get_all();

        for (const app of apps) {
            if (appname.includes(app.get_id())) {
                adwrow.subtitle = app.get_description();
                const icon = new Gtk.Image({ gicon: app.get_icon() });
                adwrow.add_prefix(icon);
                return;
            }
        }
    }

    _dragHandle(indexItem) {
        const dragHandle = new Gtk.Image({
            icon_name: "list-drag-handle-symbolic",
            css_classes: ["dim-label"],
        });
        dragHandle.set_tooltip_text(_("Drag to reorder"));

        const dragSource = new Gtk.DragSource({
            actions: Gdk.DragAction.MOVE,
        });
        dragSource.connect("prepare", () => Gdk.ContentProvider.new_for_value(String(indexItem)));
        dragHandle.add_controller(dragSource);

        return dragHandle;
    }

    _makeRowDropTarget(adwrow, menuItems, page2, indexItem) {
        const dropTarget = Gtk.DropTarget.new(GObject.TYPE_STRING, Gdk.DragAction.MOVE);
        dropTarget.connect("enter", () => {
            this._dragHighlightRow(adwrow, true);
            return Gdk.DragAction.MOVE;
        });
        dropTarget.connect("leave", () => {
            this._dragHighlightRow(adwrow, false);
        });
        dropTarget.connect("drop", (_target, value, _x, y) => {
            this._dragHighlightRow(adwrow, false);
            const fromIndex = Number.parseInt(value, 10);
            const rowIndex = Number.parseInt(indexItem, 10);

            if (Number.isNaN(fromIndex) || Number.isNaN(rowIndex)) return false;

            let toIndex = rowIndex;
            if (y > adwrow.get_height() / 2) toIndex += 1;
            if (fromIndex < toIndex) toIndex -= 1;

            this._moveItem(menuItems, page2, fromIndex, toIndex);
            return true;
        });
        adwrow.add_controller(dropTarget);
    }

    _buildList(menuItems, page2) {
        if (page2._group3 !== null) {
            page2.remove(page2._group3);
        }
        const group3 = Adw.PreferencesGroup.new();
        group3.set_title(_("Menu Items"));
        group3.set_description(_("Add custom commands to the menu, rows can be reordered by drag and drop."));
        group3.set_name("settingscenter_menuitems");
        page2.add(group3);
        page2._group3 = group3;
        const items = menuItems.getItems();

        for (const indexItem in items) {
            const item = items[indexItem];
            const appInfo = Gio.DesktopAppInfo.new(item["cmd"]);
            if (appInfo !== null) {
                item["label"] = appInfo.get_display_name();
            }
            const adwrow = new Adw.ActionRow({ title: item["label"] });
            adwrow.set_tooltip_text(item["cmd"]);
            this._addAppIcon(adwrow, item["cmd"]);
            group3.add(adwrow);
            const valueList = this._valueList(menuItems, indexItem, item);
            const buttonDel = this._buttonDel(menuItems, page2, indexItem, items.length);
            adwrow.add_prefix(this._dragHandle(indexItem));
            this._makeRowDropTarget(adwrow, menuItems, page2, indexItem);
            adwrow.add_suffix(valueList);
            adwrow.activatable_widget = valueList;
            if (buttonDel !== null) adwrow.add_suffix(buttonDel);
        }
    }

    _findWidgetByType(parent, type) {
        for (const child of parent) {
            if (child instanceof type) return child;

            const match = this._findWidgetByType(child, type);
            if (match) return match;
        }
        return null;
    }

    _addResetButton(window, settings) {
        const button = new Gtk.Button({
            label: _("Reset Settings"),
            icon_name: "edit-clear",
            css_classes: ["destructive-action"],
            vexpand: true,
            valign: Gtk.Align.END,
        });
        button.set_tooltip_text(_("Reset all settings to default values"));
        button.connect("clicked", () => {
            this._resetSettings(settings, "all");
        });

        const header = this._findWidgetByType(window.get_content(), Adw.HeaderBar);
        if (header) {
            header.pack_start(button);
        }
    }

    _resetSettings(settings, strKey) {
        if (strKey === "all") {
            // List all keys you want to reset
            const keys = ["label-menu", "items", "show-systemindicator"];
            for (const key of keys) {
                if (settings.is_writable(key)) {
                    settings.reset(key);
                }
            }
        } else if (settings.is_writable(strKey)) {
            settings.reset(strKey);
        }
    }

    fillPreferencesWindow(window) {
        window.search_enabled = true;
        window._settings = this.getSettings();
        const menuItems = new Menu_Items.MenuItems(window._settings);
        let adwrow;
        const builder = Gtk.Builder.new();
        builder.add_from_file(this.path + "/ui/prefs.ui");
        this._loadStylesheet();
        const page1 = builder.get_object("SettingsCenter_page_settings");
        const page2 = builder.get_object("SettingsCenter_page_menuitems");
        const buttonMenu = builder.get_object("SettingsCenter_row_buttonmenulabel");
        const buttonAppChooser = builder.get_object("SettingsCenter_row_buttonselectapp");
        const buttonAdd = builder.get_object("SettingsCenter_row_buttonadd");
        const valueLabelAdd = builder.get_object("SettingsCenter_row_label");
        const valueCmdAdd = builder.get_object("SettingsCenter_row_command");

        const myAppChooser = new AppChooser({
            title: _("Select app"),
            modal: true,
            transient_for: page1.get_root(),
            hide_on_close: true,
            width_request: 300,
            height_request: 600,
            resizable: false,
        });

        adwrow = builder.get_object("SettingsCenter_row_menulabel");
        adwrow.set_text(_(window._settings.get_string("label-menu")));

        buttonMenu.connect("activated", this._changeMenu.bind(this, adwrow));

        adwrow = builder.get_object("SettingsCenter_row_systemindicator");
        window._settings.bind("show-systemindicator", adwrow, "active", Gio.SettingsBindFlags.DEFAULT);

        buttonAppChooser.connect("activated", async () => {
            const errorLog = (...args) => {
                this.getLogger().error("Error:", ...args);
            };
            const handleError = (error) => {
                errorLog(error);
                return null;
            };
            const appRow = await myAppChooser.showChooser().catch(handleError);
            if (appRow !== null) {
                valueLabelAdd.set_text(appRow.title);
                valueCmdAdd.set_text(appRow.subtitle);
            }
        });
        buttonAdd.connect("activated", this._addCmd.bind(this, menuItems, page2, valueLabelAdd, valueCmdAdd));

        page2._group3 = null;
        this._buildList(menuItems, page2);
        window.set_default_size(675, 655);
        this._addResetButton(window, window._settings);
        window.add(page1);
        window.add(page2);
    }
}
