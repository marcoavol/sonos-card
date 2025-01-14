# Sonos Card

Sonos Card for Home Assistant UI with a focus on managing multiple media players!

This is a fork of the original Sonos Card by [punxaphil](https://github.com/punxaphil/custom-sonos-card) with some minor changes according to personal preferences, meant primarily for my own use. Anyone that stumbles upon this repository is encouraged to use and support the awesome original project.
## Support the original project

Do you like the Sonos Card? Support the original project by [punxaphil](https://github.com/punxaphil/custom-sonos-card) with a coffee ☕️

[![BMC](https://www.buymeacoffee.com/assets/img/custom_images/white_img.png)](https://www.buymeacoffee.com/punxaphil)

## Installation

### Without HACS

1. Download this file: sonos-card.js
2. Add this file into your <config>/www folder
3. On your dashboard click on the icon at the right top corner then on Edit dashboard
4. Click again on that icon and then on Manage resources
5. Click on Add resource
6. Copy and paste this: /local/community/sonos-card/sonos-card.js?v=1
7. Click on JavaScript Module then Create
8. Go back and refresh your page
9. You can now click on Add card in the bottom right corner and search for Custom Sonos Card
10. After any update of the file you will have to edit /local/community/sonos-card/sonos-card.js?v=1 and change the version to any higher number

## Changes

* Fixed a bug where un-/grouping of media players was not working when the active player was deselected at the same time
* Added an option to configure the title of the media browse section as a button that takes a tap action (for example to open Sonos app on mobile)
* Fixed minor spacing and layout issues
* Combined the volumes and grouping sections
* ...
