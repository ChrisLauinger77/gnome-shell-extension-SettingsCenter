#!/bin/bash

# glib-compile-schemas SettingsCenter\@lauinger-clan.de/schemas/

cd SettingsCenter\@lauinger-clan.de
gnome-extensions pack --podir=../po/ --out-dir=../ --extra-source=menu_items.js --extra-source=../LICENSE
cd ..
mv SettingsCenter@lauinger-clan.de.shell-extension.zip SettingsCenter@lauinger-clan.de.zip

if [ "$1" = "zip" ] || [ "$1" = "pack" ]; then
   echo "Extension zip created ..."
else
   gnome-extensions install SettingsCenter\@lauinger-clan.de.zip --force
   gnome-extensions enable SettingsCenter\@lauinger-clan.de
fi