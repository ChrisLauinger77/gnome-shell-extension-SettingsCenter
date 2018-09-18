my fork adds 3.26 , 3.28 and 3.30 - but I could only test on 3.30

### Description: 

Settings Center is a customizable drop-down menu for quickly launching frequently used apps in Gnome:Shell via the user/aggregate menu. Originally created by XES. 

v10: fix for older versions, i havent tested this on anything below 3.10
v9: minor cleanup, now has an icon for the main menu entry.

Settings shortcuts : gnome-tweak-tool, dconf-editor, gconf-editor, gnome-session-properties, gnome-shell-extension-prefs, seahorse and nvidia-settings. You can add your own

Original source : http://svn.xesnet.fr/gnomeextensions (3.8 replace Settings code credit IsacDaavid)

Credit to @peaceseeker for updating this with a working repo, i do wish it could have been pushed to me but my blank repo was deleted as it was stale, i failed to push to git before going back to work around 1.5 years ago and i hadn't been active enough to notice anything other than emails(these things help people!)


### TODO:
pull in changes for 3.10-3.16 from @peaceseeker _done_
add option to change current titles
as of 3.10 and up the aggregate menu (which i and mathematicalcoffee pushed designs for, without credits) is becoming cluttered so the following line needs to be considered heavily:
create own button and merge pa-shorcuts, eventually... anything being added to the aggreate menu now needs to be done in a reasonable fashion matching gnome hig.


### 1 click install from E.G.O:

https://extensions.gnome.org/extension/341/settingscenter/

_this is not the fork, of my fork of XES' original work, by vistaus, who never attempted to contact me to update this. i am not, nor do i represent, vistaus_


### Screenshot

![Screenshot](https://raw.github.com/l300lvl/XES-Settings-Center-Extension/master/screenshot.png)
