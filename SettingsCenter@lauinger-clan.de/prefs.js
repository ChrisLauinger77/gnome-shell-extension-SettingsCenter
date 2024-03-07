import Gtk from "gi://Gtk";
import Gio from "gi://Gio";
import Adw from "gi://Adw";
import * as Menu_Items from "./menu_items.js";
import {
    ExtensionPreferences,
    gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

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
        menuItems.delItem(index);

        this._buildList(menuItems, page2);
    }

    _buttonUp(menuItems, page2, indexItem) {
        const buttonUp = new Gtk.Button({
            label: _("Up"),
            valign: Gtk.Align.CENTER,
        });
        buttonUp.set_icon_name("go-up-symbolic");
        if (indexItem > 0)
            buttonUp.connect(
                "clicked",
                this._changeOrder.bind(this, menuItems, page2, indexItem, -1)
            );
        return buttonUp;
    }

    _buttonDown(menuItems, page2, indexItem, itemslen) {
        const buttonDown = new Gtk.Button({
            label: _("Down"),
            valign: Gtk.Align.CENTER,
        });
        buttonDown.set_icon_name("go-down-symbolic");
        if (indexItem < itemslen - 1)
            buttonDown.connect(
                "clicked",
                this._changeOrder.bind(this, menuItems, page2, indexItem, 1)
            );
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

    _onBtnClicked(btn, filechooser) {
        let parent = btn.get_root();
        filechooser.set_transient_for(parent);

        const desktopFileFilter = new Gtk.FileFilter();
        filechooser.set_filter(desktopFileFilter);
        desktopFileFilter.add_pattern("*.desktop");

        filechooser.title = _("Select desktop file");

        filechooser.show();
    }

    _getFilename(fullPath) {
        log("_getFilename fullPath: " + fullPath);
        return fullPath.replace(/^.*[\\/]/, "");
    }

    _updateLabelAddCmdAdd(valueLabelAdd, valueCmdAdd) {
        let lastchoosenfile =
            this.getSettings().get_string("last-choosen-file");
        if (lastchoosenfile.includes("###")) {
            let array_lastchoosenfile = lastchoosenfile.split("###");
            valueLabelAdd.set_text(array_lastchoosenfile[0]);
            valueCmdAdd.set_text(array_lastchoosenfile[1]);
        }
    }

    _onFileChooserResponse(native, response) {
        if (response !== Gtk.ResponseType.ACCEPT) {
            return;
        }
        let fileURI = native.get_file().get_uri().replace("file://", "");

        let valueLabelAdd = this._getFilename(fileURI).replace(".desktop", "");
        log("_onFileChooserResponse valueLabelAdd: " + valueLabelAdd);
        let valueCmdAdd = this._getFilename(fileURI);
        log("_onFileChooserResponse valueCmdAdd: " + valueCmdAdd);
        this.getSettings().set_string(
            "last-choosen-file",
            valueLabelAdd + "###" + valueCmdAdd
        );
    }

    fillPreferencesWindow(window) {
        window._settings = this.getSettings();
        const menuItems = new Menu_Items.MenuItems(window._settings);
        let adwrow;
        const page1 = Adw.PreferencesPage.new();
        page1.set_title(_("Settings"));
        page1.set_name("settingscenter_page1");
        page1.set_icon_name("preferences-system-symbolic");

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
        window._settings.connect(
            "changed::last-choosen-file",
            this._updateLabelAddCmdAdd.bind(this, valueLabelAdd, valueCmdAdd)
        );
        const buttonfilechooser = new Gtk.Button({
            label: _("Select desktop file"),
            valign: Gtk.Align.CENTER,
        });
        buttonfilechooser.set_tooltip_text(
            _("Usually located in '/usr/share/applications'")
        );
        adwrow.add_suffix(buttonfilechooser);
        adwrow.activatable_widget = buttonfilechooser;

        const filechooser = new Gtk.FileChooserNative({
            title: _("Select desktop file"),
            modal: true,
            action: Gtk.FileChooserAction.OPEN,
        });
        buttonfilechooser.connect(
            "clicked",
            this._onBtnClicked.bind(this, buttonfilechooser, filechooser)
        );
        filechooser.connect("response", this._onFileChooserResponse.bind(this));
        const buttonAdd = new Gtk.Button({
            label: _("Add"),
            valign: Gtk.Align.CENTER,
        });
        //page2
        const page2 = Adw.PreferencesPage.new();
        page2.set_title(_("Settings Center"));
        page2.set_name("settingscenter_page2");
        page2.set_icon_name("preferences-other-symbolic");

        buttonAdd.connect(
            "clicked",
            this._addCmd.bind(
                this,
                menuItems,
                page2,
                valueLabelAdd,
                valueCmdAdd
            )
        );
        buttonAdd.set_tooltip_text(
            _("'Label' and 'Command' must be filled out !")
        );
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
