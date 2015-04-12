/* original author Xes. 3.6/3.8 fork l300lvl. replace system settings menu credit: IsacDaavid */

const St = imports.gi.St;
const Config = imports.misc.config;
const Main = imports.ui.main;
const Lang = imports.lang;
const Shell = imports.gi.Shell;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Lib = Extension.imports.lib;
const MenuItems = Extension.imports.menu_items;

const schema = "org.gnome.shell.extensions.SettingsCenter";

let userMenu, age;

function init(extensionMeta)
{
    let current_version = Config.PACKAGE_VERSION.split('.');
    if (current_version.length > 4 || current_version[0] != 3) throw new Error("Strange version number (extension.js:21).");
    
    switch (current_version[1]) {
        case"4": age = "old";
        break;
        case"5": global.log("Warning of extension [" + metadata.uuid + "]:\n              Development release detected (" + Config.PACKAGE_VERSION + "). Loading as a 3.6 release.\n"); //eak
        case"6": age = "new";
        break;
        case"8": age = "new2";
        break;
        default: throw new Error("Strange version number (extension.js:31).");
    }

    if (age=="old") userMenu = Main.panel._statusArea.userMenu;
    else            userMenu = Main.panel.statusArea.userMenu;

    return new SettingsCenter(extensionMeta, schema);
}

let new3;

function SettingsCenter(extensionMeta, schema)
{
    this.init(extensionMeta, schema);
}

SettingsCenter.prototype =
{
    schema: null,
    settings: null,
    settingSignals: null,

    settingsCenterMenu: null,
    items: null,
    replaceMenu: null,

    init: function(extensionMeta, schema)
    {
	this.schema = schema;
    },

    onPreferencesActivate: function()
    {
	let app = Shell.AppSystem.get_default().lookup_app('gnome-control-center.desktop');
	app.activate();
    },

    launch: function(object, pspec, settingItem)
    {
        if (settingItem['cmd'].match(/.desktop$/))
        {
            let app = Shell.AppSystem.get_default().lookup_app(settingItem['cmd']);

            if (app != null)
                app.activate();
            else if (settingItem['cmd-alt'] != null)
                Util.spawn([settingItem['cmd-alt']]);
        }
        else
	{
	    let cmdArray = settingItem['cmd'].split(" ");
            Util.spawn(cmdArray);
	}
    },

    onParamChanged: function()
    {
        this.disable();
        this.enable();
    },

    enable: function()
    {
	let settings = new Lib.Settings(this.schema);
        this.settings = settings.getSettings();

	this.settingSignals = new Array();

	let menuItems = new MenuItems.MenuItems(this.settings);
        this.items = menuItems.getEnableItems();

        let index = null;
        let menuItems = userMenu.menu._getMenuItems();
	//Find System Settings menu position, "Settings" on > 3.8
        if (age=="new2") new3 = "Settings";
        else             new3 = "System Settings";
        for (let i = 0; i < menuItems.length; i++)
        {    
	    if (
		typeof (menuItems[i]._children) == "object"
		    && typeof (menuItems[i]._children[0]) == "object"
		    && typeof (menuItems[i]._children[0].actor) == "object"
		    && typeof (menuItems[i]._children[0].actor.get_text) == "function"
		    && menuItems[i]._children[0].actor.get_text() == _(new3))
	    {
                index = i;
                break;
	    }
        }

	this.replaceMenu = this.settings.get_boolean("replace-ss-menu");

	//If no find, set the position arbitrary and force "replace menu" to Off
	if (index == null)
	{
	    index = 4;
	    this.replaceMenu = false;
	}
        
	if (this.replaceMenu || this.items.length > 0)
	{
            this.settingsCenterMenu = new PopupMenu.PopupSubMenuMenuItem(_(this.settings.get_string("label-menu")));

	    //Add new menu to status area
	    userMenu.menu.addMenuItem(this.settingsCenterMenu, index + 1);

	    let i = 0;

	    //Replace System Settings Menu if defined
	    if (this.replaceMenu)
	    {
		menuItems[index].destroy();
		
		let item = new PopupMenu.PopupMenuItem(_(new3));
		item.connect("activate", Lang.bind(this, this.onPreferencesActivate));
		this.settingsCenterMenu.menu.addMenuItem(item, i++);
	    }

	    //Add others menus
	    for (let indexItem in this.items)
	    {
		let menuItem = new PopupMenu.PopupMenuItem(_(this.items[indexItem]["label"]), 0);
		menuItem.connect("activate", Lang.bind(this, this.launch, this.items[indexItem]));
		
		this.settingsCenterMenu.menu.addMenuItem(menuItem, i++);
	    }       
	    
	    this.settingSignals.push(this.settings.connect("changed::label-menu", Lang.bind(this, this.onParamChanged)));
	}

	this.settingSignals.push(this.settings.connect("changed::replace-ss-menu", Lang.bind(this, this.onParamChanged)));
	this.settingSignals.push(this.settings.connect("changed::items", Lang.bind(this, this.onParamChanged)));
    },

    disable: function()
    {
	//Remove setting Signals
	this.settingSignals.forEach(
	    function(signal)
	    {
                this.settings.disconnect(signal);
	    },
            this
        );
	this.settingSignals = null;

	//Find new menu position
        let index = null;
        let menuItems = userMenu.menu._getMenuItems();
        for (let i = 0; i < menuItems.length; i++)
        {    
	    if (menuItems[i] == this.settingsCenterMenu)
	    {
                index = i;
                break;
	    }
        }

	if (index == null)
	    return;

	//Add original menu if necessary
	if (this.replaceMenu)
	{
            let item = new PopupMenu.PopupMenuItem(_(new3));
            item.connect("activate", Lang.bind(this, this.onPreferencesActivate));
	    userMenu.menu.addMenuItem(item, index);
	}
	
	//Remove new menu
	if (this.settingsCenterMenu != null)
	{
            this.settingsCenterMenu.destroy();
	    this.settingsCenterMenu = null;
	}
    }
}
