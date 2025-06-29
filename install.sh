#!/bin/bash

# glib-compile-schemas SettingsCenter\@lauinger-clan.de/schemas/

cd SettingsCenter\@lauinger-clan.de
gnome-extensions pack --podir=../po/ --out-dir=../ --extra-source=menu_items.js --extra-source=../LICENSE
cd ..

if [ "$1" = "zip" ] || [ "$1" = "pack" ]; then
   echo "Extension zip created ..."
else
   gnome-extensions install SettingsCenter\@lauinger-clan.de.shell-extension.zip --force
   gnome-extensions enable SettingsCenter\@lauinger-clan.shell-extension.de
fi