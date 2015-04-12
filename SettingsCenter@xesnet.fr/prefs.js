const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Lib = Extension.imports.lib;
const MenuItems = Extension.imports.menu_items;

const schema = "org.gnome.shell.extensions.SettingsCenter";

function init()
{

}

function buildPrefsWidget()
{
    let prefs = new Prefs(schema);

    return prefs.buildPrefsWidget();
}

function Prefs(schema)
{
    this.init(schema);
}

Prefs.prototype =
{
    settings: null,
    menuItems: null,

    vboxList: null,
    hboxsList: new Array(),

    init: function(schema)
    {
	let settings = new Lib.Settings(schema);
	
	this.settings = settings.getSettings();

	this.menuItems = new MenuItems.MenuItems(this.settings);
    },

    changeMenu: function(object, text)
    {
	this.settings.set_string("label-menu", text.get_text());
    },

    changeReplace: function(object, pspec)
    {
	this.settings.set_boolean("replace-ss-menu", object.get_active());
    },

    changeEnable: function(object, pspec, index)
    {
	this.menuItems.changeEnable(index, object.active);
    },

    addCmd: function(object, label, cmd)
    {
	this.menuItems.addItem(label.get_text(), cmd.get_text());

	label.set_text("");
	cmd.set_text("");

	this.buildList();
    },

    changeOrder: function(object, index, order)
    {
	this.menuItems.changeOrder(index, order);

	this.buildList();
    },
    
    delCmd: function(object, index)
    {
	this.menuItems.delItem(index);

	this.buildList();
    },

    buildList: function()
    {
	for (let indexHboxsList in this.hboxsList)
	    this.vboxList.remove(this.hboxsList[indexHboxsList]);
	this.hboxsList = new Array();

	let items = this.menuItems.getItems();

	for (let indexItem in items)
	{
            let item = items[indexItem];

            let hboxList = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
            let labelList = new Gtk.Label({label: item["label"], xalign: 0});

	    let buttonUp = new Gtk.Button({ label: "Up" });
	    if (indexItem > 0)
		buttonUp.connect("clicked", Lang.bind(this, this.changeOrder, indexItem, -1));
    
	    let buttonDown = new Gtk.Button({ label: "Down" });
	    if (indexItem < items.length - 1)	
		buttonDown.connect("clicked", Lang.bind(this, this.changeOrder, indexItem, 1));

            let valueList = new Gtk.Switch({active: (item["enable"] == "1")});
            valueList.connect("notify::active", Lang.bind(this, this.changeEnable, indexItem));

            let buttonDel = null;
            if (items.length > 1)
            {
		buttonDel = new Gtk.Button({ label: "Del", margin_left: 10});
		buttonDel.connect("clicked", Lang.bind(this, this.delCmd, indexItem));
            }

            hboxList.pack_start(labelList, true, true, 0);

            hboxList.add(valueList);
	    hboxList.add(buttonUp);
	    hboxList.add(buttonDown);

            if (buttonDel != null)
		hboxList.add(buttonDel);
            this.vboxList.add(hboxList);

            this.hboxsList.push(hboxList);
	}

	this.vboxList.show_all();
    },

    buildPrefsWidget: function()
    {
	let frame = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, border_width: 10 });

	let label = new Gtk.Label({ label: "<b>Global</b>", use_markup: true, xalign: 0 });
	let vbox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, margin_left: 20 });



	let hboxMenu = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
	let labelMenu = new Gtk.Label({label: "Menu Label", xalign: 0});
	let valueMenu = new Gtk.Entry({ hexpand: true });
	valueMenu.set_text(this.settings.get_string("label-menu"));
	let buttonMenu = new Gtk.Button({ label: "Apply" });
	buttonMenu.connect("clicked", Lang.bind(this, this.changeMenu, valueMenu));

	hboxMenu.pack_start(labelMenu, true, true, 0);
	hboxMenu.add(valueMenu);
	hboxMenu.add(buttonMenu);
	vbox.add(hboxMenu);

	frame.add(label);
	frame.add(vbox);



	vbox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, margin_left: 20 });

	let hboxReplace = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
	let labelReplace = new Gtk.Label({label: "Replace System Settings (Only if found)", xalign: 0});
	let valueReplace = new Gtk.Switch({active: this.settings.get_boolean("replace-ss-menu")});
	valueReplace.connect('notify::active', Lang.bind(this, this.changeReplace));

	hboxReplace.pack_start(labelReplace, true, true, 0);
	hboxReplace.add(valueReplace);
	vbox.add(hboxReplace);

	frame.add(vbox);




	label = new Gtk.Label({ label: "<b>Menu Items</b>", use_markup: true, xalign: 0 });
	this.vboxList = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, margin_left: 20 });

	this.buildList();

	frame.add(label);
	frame.add(this.vboxList);



	label = new Gtk.Label({ label: "<b>Add Menu</b>", use_markup: true, xalign: 0 });
	vbox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, margin_left: 20 });

	let hboxLabelAdd = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
	let labelLabelAdd = new Gtk.Label({label: "Label", xalign: 0});
	let valueLabelAdd = new Gtk.Entry({ hexpand: true });

	hboxLabelAdd.pack_start(labelLabelAdd, true, true, 0);
	hboxLabelAdd.add(valueLabelAdd);
	vbox.add(hboxLabelAdd);

	let hboxCmdAdd = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
	let labelCmdAdd = new Gtk.Label({label: "Command", xalign: 0});
	let valueCmdAdd = new Gtk.Entry({ hexpand: true });

	hboxCmdAdd.pack_start(labelCmdAdd, true, true, 0);
	hboxCmdAdd.add(valueCmdAdd);
	vbox.add(hboxCmdAdd);

	let hboxButtonAdd = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
	let buttonAdd = new Gtk.Button({ label: "Add" });
	buttonAdd.connect("clicked", Lang.bind(this, this.addCmd, valueLabelAdd, valueCmdAdd));

	hboxButtonAdd.add(buttonAdd, true, true, 0);
	vbox.add(hboxButtonAdd);

	frame.add(label);
	frame.add(vbox);



	frame.show_all();

	return frame;
    }
}
