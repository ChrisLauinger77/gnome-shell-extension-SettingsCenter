const { Adw, Gtk } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Menu_Items = Me.imports.menu_items;
const Gettext = imports.gettext.domain("SettingsCenter");
const _ = Gettext.gettext;
const g_schema = "org.gnome.shell.extensions.SettingsCenter";

//only here to be catched by translation
const strFix2 = _("Desktop Config Editor");
const strFix3 = _("Gnome Config Editor");
const strFix4 = _("Session Properties");
const strFix5 = _("Extensions Preferences");
const strFix6 = _("Passwords and Keys");
const strFix7 = _("NVidia Settings");
const strFix1 = _("Gnome Tweaks");

function init() {
    ExtensionUtils.initTranslations("SettingsCenter");
}

// used until GNOME 42 (41 and before)
function buildPrefsWidget() {
    let prefs = new Prefs(g_schema);

    return prefs.buildPrefsWidget();
}

// used starting with GNOME 42

function fillPreferencesWindow(window) {
    let adwprefs = new AdwPrefs(g_schema, window);

    return adwprefs.fillPreferencesWindow();
}
class Prefs {
    constructor(schema) {
        this._settings = ExtensionUtils.getSettings(schema);
        this._menuItems = new Menu_Items.MenuItems(this._settings);
        this._vboxList = null;
        this._hboxsList = new Array();
    }

    changeMenu(text) {
        this._settings.set_string("label-menu", text.text);
    }

    changeEnable(index, valueList) {
        this._menuItems.changeEnable(index, Number(valueList.active));
    }

    addCmd(label, cmd) {
        this._menuItems.addItem(label.text, cmd.text);

        label.text = "";
        cmd.text = "";

        this.buildList();
    }

    changeOrder(index, order) {
        this._menuItems.changeOrder(index, order);

        this.buildList();
    }

    delCmd(index) {
        this._menuItems.delItem(index);

        this.buildList();
    }

    _buttonUp(indexItem) {
        let buttonUp = new Gtk.Button({ label: _("Up") });
        if (indexItem > 0)
            buttonUp.connect(
                "clicked",
                this.changeOrder.bind(this, indexItem, -1)
            );
        return buttonUp;
    }

    _buttonDown(indexItem, itemslen) {
        let buttonDown = new Gtk.Button({ label: _("Down") });
        if (indexItem < itemslen - 1)
            buttonDown.connect(
                "clicked",
                this.changeOrder.bind(this, indexItem, 1)
            );
        return buttonDown;
    }

    _buttonDel(indexItem, itemslen) {
        let buttonDel = null;
        if (itemslen > 1) {
            buttonDel = new Gtk.Button({
                label: _("Del"),
                margin_start: 10,
            });
            buttonDel.connect("clicked", this.delCmd.bind(this, indexItem));
        }
        return buttonDel;
    }

    _valueList(indexItem, item) {
        let valueList = new Gtk.Switch({ active: item["enable"] == "1" });
        valueList.connect(
            "notify::active",
            this.changeEnable.bind(this, indexItem, valueList)
        );
        return valueList;
    }

    buildList() {
        for (let indexHboxsList in this._hboxsList)
            this._vboxList.remove(this._hboxsList[indexHboxsList]);
        this._hboxsList = new Array();

        let items = this._menuItems.getItems();

        for (let indexItem in items) {
            let item = items[indexItem];

            let hboxList = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                spacing: 12,
            });
            let labelList = new Gtk.Label({ label: item["label"], xalign: 0 });

            let buttonUp = this._buttonUp(indexItem);
            let buttonDown = this._buttonDown(indexItem, items.length);
            let valueList = this._valueList(indexItem, item);
            let buttonDel = this._buttonDel(indexItem, items.length);

            hboxList.prepend(labelList);

            hboxList.append(valueList);
            hboxList.append(buttonUp);
            hboxList.append(buttonDown);

            if (buttonDel != null) hboxList.append(buttonDel);
            this._vboxList.append(hboxList);

            this._hboxsList.push(hboxList);
        }
    }

    buildPrefsWidget() {
        let frame = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 12,
        });

        let label = new Gtk.Label({
            label: "<b>" + _("Global") + "</b>",
            use_markup: true,
            xalign: 0,
        });
        let vbox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 12,
            margin_start: 20,
        });

        let hboxMenu = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 12,
        });
        let labelMenu = new Gtk.Label({ label: _("Menu Label"), xalign: 0 });
        let valueMenu = new Gtk.Entry({ hexpand: true });
        valueMenu.set_text(this._settings.get_string("label-menu"));
        let buttonMenu = new Gtk.Button({ label: _("Apply") });

        buttonMenu.connect("clicked", this.changeMenu.bind(this, valueMenu));

        hboxMenu.prepend(labelMenu);
        hboxMenu.append(valueMenu);
        hboxMenu.append(buttonMenu);
        vbox.append(hboxMenu);

        frame.append(label);
        frame.append(vbox);

        vbox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 12,
            margin_start: 20,
        });

        frame.append(vbox);

        label = new Gtk.Label({
            label: "<b>" + _("Menu Items") + "</b>",
            use_markup: true,
            xalign: 0,
        });
        this._vboxList = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 12,
            margin_start: 20,
        });

        this.buildList();

        frame.append(label);
        frame.append(this._vboxList);

        label = new Gtk.Label({
            label: "<b>" + _("Add Menu") + "</b>",
            use_markup: true,
            xalign: 0,
        });
        vbox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 12,
            margin_start: 20,
        });

        let hboxLabelAdd = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 12,
        });
        let labelLabelAdd = new Gtk.Label({ label: _("Label"), xalign: 0 });
        let valueLabelAdd = new Gtk.Entry({ hexpand: true });

        hboxLabelAdd.prepend(labelLabelAdd);
        hboxLabelAdd.append(valueLabelAdd);
        vbox.append(hboxLabelAdd);

        let hboxCmdAdd = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 12,
        });
        let labelCmdAdd = new Gtk.Label({ label: _("Command"), xalign: 0 });
        let valueCmdAdd = new Gtk.Entry({ hexpand: true });

        hboxCmdAdd.prepend(labelCmdAdd);
        hboxCmdAdd.append(valueCmdAdd);
        vbox.append(hboxCmdAdd);

        let hboxButtonAdd = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 12,
        });
        let buttonAdd = new Gtk.Button({ label: _("Add") });
        buttonAdd.connect(
            "clicked",
            this.addCmd.bind(this, valueLabelAdd, valueCmdAdd)
        );

        hboxButtonAdd.append(buttonAdd);
        vbox.append(hboxButtonAdd);

        frame.append(label);
        frame.append(vbox);

        return frame;
    }
}

class AdwPrefs extends Prefs {
    constructor(schema, window) {
        super(schema);
        this._window = window;
        this._page1 = null;
        this._group3 = null;
    }

    buildList() {
        if (this._group3 !== null) {
            this._page1.remove(this._group3);
        }

        this._group3 = Adw.PreferencesGroup.new();
        this._group3.set_title(_("Menu Items"));
        this._group3.set_name("settingscenter_menuitems");
        this._page1.add(this._group3);
        let items = this._menuItems.getItems();

        for (let indexItem in items) {
            let item = items[indexItem];
            let adwrow = new Adw.ActionRow({ title: _(item["label"]) });
            this._group3.add(adwrow);
            let buttonUp = this._buttonUp(indexItem);
            let buttonDown = this._buttonDown(indexItem, items.length);
            let valueList = this._valueList(indexItem, item);
            let buttonDel = this._buttonDel(indexItem, items.length);
            adwrow.add_suffix(valueList);
            adwrow.activatable_widget = valueList;
            adwrow.add_suffix(buttonUp);
            adwrow.add_suffix(buttonDown);
            if (buttonDel != null) adwrow.add_suffix(buttonDel);
        }
    }

    fillPreferencesWindow() {
        let adwrow;
        this._page1 = Adw.PreferencesPage.new();
        this._page1.set_title(_("Settings Center"));
        this._page1.set_name("settingscenter_page");
        this._page1.set_icon_name("folder-symbolic");

        // group1
        let group1 = Adw.PreferencesGroup.new();
        group1.set_title(_("Global"));
        group1.set_name("settingscenter_global");
        this._page1.add(group1);
        adwrow = new Adw.ActionRow({ title: _("Menu Label") });
        group1.add(adwrow);
        let valueMenu = new Gtk.Entry({ hexpand: true });

        valueMenu.set_text(_(this._settings.get_string("label-menu")));
        let buttonMenu = new Gtk.Button({ label: _("Apply") });
        buttonMenu.connect("clicked", this.changeMenu.bind(this, valueMenu));
        adwrow.add_suffix(valueMenu);
        adwrow.add_suffix(buttonMenu);
        adwrow.activatable_widget = buttonMenu;

        // group2
        let group2 = Adw.PreferencesGroup.new();
        group2.set_title(_("Add Menu"));
        group2.set_name("settingscenter_addmenu");
        this._page1.add(group2);
        adwrow = new Adw.ActionRow({ title: _("Label") });
        group2.add(adwrow);
        let valueLabelAdd = new Gtk.Entry({ hexpand: true });
        adwrow.add_suffix(valueLabelAdd);
        adwrow = new Adw.ActionRow({ title: _("Command") });
        group2.add(adwrow);
        let valueCmdAdd = new Gtk.Entry({ hexpand: true });
        adwrow.add_suffix(valueCmdAdd);
        adwrow = new Adw.ActionRow({ title: "" });
        group2.add(adwrow);
        let buttonAdd = new Gtk.Button({ label: _("Add") });
        buttonAdd.connect(
            "clicked",
            this.addCmd.bind(this, valueLabelAdd, valueCmdAdd)
        );
        adwrow.add_suffix(buttonAdd);
        adwrow.activatable_widget = buttonAdd;
        // group3
        this.buildList();
        this._window.set_default_size(675, 800);
        this._window.add(this._page1);
    }
}
