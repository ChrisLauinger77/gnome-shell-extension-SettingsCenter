export const MenuItems = class MenuItems {
    constructor(settings) {
        this._settings = settings;
    }

    getItems() {
        let itemsString = this._settings.get_string("items");

        return this.itemsToArray(itemsString);
    }

    setItems(items) {
        let itemsString = this.itemsToString(items);

        this._settings.set_string("items", itemsString);
    }

    getEnableItems() {
        let items = this.getItems();
        let indexItem;
        let itemsEnable = new Array();

        for (indexItem in items) {
            let item = items[indexItem];

            if (item["enable"]) itemsEnable.push(item);
        }

        return itemsEnable;
    }

    getItem(index) {
        let items = this.getItems();

        if (index >= 0 && index < items.length) return items[index];
        else return null;
    }

    isEnable(index) {
        let item = this.getItem(index);

        if (item != null) return item["enable"];
        else return null;
    }

    changeOrder(index, posRel) {
        let items = this.getItems();

        if (
            (posRel < 0 && index > 0) ||
            (posRel > 0 && index < items.length - 1)
        ) {
            let temp = items[index];
            items.splice(index, 1);
            items.splice(parseInt(index) + posRel, 0, temp);

            this.setItems(items);

            return true;
        } else return false;
    }

    changeEnable(index, value) {
        let items = this.getItems();

        if (index < 0 && index >= items.length) return false;

        items[index]["enable"] = value;

        this.setItems(items);

        return true;
    }

    addItem(label, cmd) {
        let items = this.getItems();

        let item = {
            label: label,
            cmd: cmd,
            enable: "1",
            "cmd-alt": cmd.replace(".desktop", ""),
        };

        items.push(item);

        this.setItems(items);
    }

    delItem(index) {
        let items = this.getItems();

        if (index < 1 && index >= items.length) return false;

        items.splice(index, 1);

        this.setItems(items);

        return true;
    }

    itemsToArray(itemsString) {
        let items = itemsString.split("|");

        let itemsArray = new Array();

        for (let indexItem in items) {
            let itemDatas = items[indexItem].split(";");

            let item = {
                label: itemDatas[0],
                cmd: itemDatas[1],
                enable: itemDatas[2] == "1",
                "cmd-alt": itemDatas[3],
            };

            itemsArray.push(item);
        }

        return itemsArray;
    }

    itemsToString(itemsArray) {
        let items = new Array();

        for (let indexItem in itemsArray) {
            let itemDatasArray = itemsArray[indexItem];

            let itemDatasString =
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
