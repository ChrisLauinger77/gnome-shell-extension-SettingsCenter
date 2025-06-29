#!/bin/bash

# glib-compile-schemas SettingsCenter\@lauinger-clan.de/schemas/

cd SettingsCenter\@lauinger-clan.de
gnome-extensions pack --podir=../po/ --out-dir=../ --extra-source=menu_items.js --extra-source=../LICENSE --force
cd ..

case "$1" in
  zip|pack)
    echo "Extension zip created ..."
    ;;
  install)
    gnome-extensions install SettingsCenter\@lauinger-clan.de.shell-extension.zip --force
    gnome-extensions enable SettingsCenter\@lauinger-clan.de
    ;;
  upload)
    gnome-extensions upload SettingsCenter\@lauinger-clan.de.shell-extension.zip
    ;;
  *)
    echo "Usage: $0 {zip|pack|install|upload}"
    exit 1
    ;;
esac