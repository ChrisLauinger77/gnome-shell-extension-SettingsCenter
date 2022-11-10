#!/bin/bash

reffile=SettingsCenter.pot

xgettext --from-code=UTF-8 --output=po/"$reffile" SettingsCenter\@lauinger-clan.de/*.js

cd po

for pofile in *.po
	do
		echo "Updateing: $pofile"
		msgmerge -U "$pofile" "$reffile"
	done
echo "Done."

