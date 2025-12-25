"use strict";

export const MenuItems = class MenuItems {
    constructor(settings) {
        this._settings = settings;
    }

    getItems() {
        const itemsString = this._settings.get_string("items");

        return this.itemsToArray(itemsString);
    }

    setItems(items) {
        const itemsString = this.itemsToString(items);

        this._settings.set_string("items", itemsString);
    }

    getEnableItems() {
        const items = this.getItems();
        const itemsEnable = [];

        for (const indexItem in items) {
            const item = items[indexItem];
            if (item["enable"]) itemsEnable.push(item);
        }

        return itemsEnable;
    }

    getItem(index) {
        const items = this.getItems();

        if (index >= 0 && index < items.length) return items[index];
        else return null;
    }

    isEnable(index) {
        const item = this.getItem(index);

        if (item === null) return null;
        return item["enable"];
    }

    changeOrder(index, posRel) {
        const items = this.getItems();

        if ((posRel < 0 && index > 0) || (posRel > 0 && index < items.length - 1)) {
            const temp = items[index];
            items.splice(index, 1);
            items.splice(Number.parseInt(index) + posRel, 0, temp);

            this.setItems(items);

            return true;
        } else return false;
    }

    changeEnable(index, value) {
        const items = this.getItems();

        if (index < 0 && index >= items.length) return false;

        items[index]["enable"] = value;

        this.setItems(items);

        return true;
    }

    addItem(label, cmd) {
        const items = this.getItems();

        const item = {
            label: label,
            cmd: cmd,
            enable: "1",
            "cmd-alt": cmd.replace(".desktop", ""),
        };

        items.push(item);

        this.setItems(items);
    }

    delItem(index) {
        const items = this.getItems();

        if (index < 1 && index >= items.length) return false;

        items.splice(index, 1);

        this.setItems(items);

        return true;
    }

    itemsToArray(itemsString) {
        const items = itemsString.split("|");

        const itemsArray = [];

        for (const indexItem in items) {
            const itemData = items[indexItem].split(";");

            const item = {
                label: itemData[0],
                cmd: itemData[1],
                enable: itemData[2] === "1",
                "cmd-alt": itemData[3],
            };

            itemsArray.push(item);
        }

        return itemsArray;
    }

    itemsToString(itemsArray) {
        const items = [];

        for (const indexItem in itemsArray) {
            const itemDatasArray = itemsArray[indexItem];

            const itemDatasString =
                itemDatasArray["label"] +
                ";" +
                itemDatasArray["cmd"] +
                ";" +
                (itemDatasArray["enable"] ? "1" : "0") +
                ";" +
                itemDatasArray["cmd-alt"];

            items.push(itemDatasString);
        }

        return items.join("|");
    }
};
