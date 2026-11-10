# Quote Selection

A Thunderbird add-on that adds a **Quote** button to the formatting toolbar of the compose window. It turns the selected text (or the paragraph under the cursor) into a quotation, with a vertical bar on the left. Press the button again to remove the quotation.

- **HTML messages:** uses the editor's own Indent/Outdent, so the whole paragraph is quoted even when only part of it is selected. The quote is a `<blockquote type="cite">` with an inline style, so the bar also shows in Gmail and Outlook. The style is set by `QUOTE_STYLE` in `quote.js`.
- **Plain-text messages:** adds or removes one `> ` level on the selected paragraphs.
- **Button position:** Thunderbird always appends add-on buttons at the end of the formatting toolbar. `placement.js` is a small [Experiment API](https://developer.thunderbird.net/add-ons/mailextensions/experiments) that moves the button between Indent and Align. If it fails, the button still works, just at the end of the toolbar.

Tested on Thunderbird 159 (minimum version 128, Manifest V3).

## Install

Temporary (until Thunderbird restarts): *Tools → Developer Tools → Debug Add-ons → This Thunderbird → Load Temporary Add-on…*, then select `manifest.json`.

Permanent: the add-on is not signed. Package it with `zip -j quote-selection.xpi manifest.json background.js quote.js quote.svg placement.js placement.json`, then either have it signed for self-distribution on addons.thunderbird.net, or set `xpinstall.signatures.required` to `false` in the Config Editor (this disables signature checking for all add-ons) and use *Install Add-on From File…*.

Close and reopen compose windows after installing or reloading, since the script is only injected into windows opened afterwards.
