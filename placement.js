"use strict";

var { ExtensionSupport } = ChromeUtils.importESModule("resource:///modules/ExtensionSupport.sys.mjs");

const COMPOSE_WINDOW = "chrome://messenger/content/messengercompose/messengercompose.xhtml";

// Même calcul que makeWidgetId() de Thunderbird, qui nomme le bouton de l'addon.
const widgetId = (id) => id.toLowerCase().replace(/[^a-z0-9_-]/g, "_");

this.quoteButtonPlacement = class extends ExtensionAPI {
  getAPI(context) {
    const buttonId = `${widgetId(context.extension.id)}-composeAction-toolbarbutton`;
    return {
      quoteButtonPlacement: {
        start: async () => {
          if (this.listenerId) return;
          this.listenerId = `${buttonId}-placement`;
          this.observers = new Map();
          ExtensionSupport.registerWindowListener(this.listenerId, {
            chromeURLs: [COMPOSE_WINDOW],
            onLoadWindow: (win) => this.watch(win, buttonId),
            onUnloadWindow: (win) => {
              this.observers.get(win)?.disconnect();
              this.observers.delete(win);
            },
          });
        },
      },
    };
  }

  // Thunderbird ajoute le bouton en fin de barre, à un moment que l'on ne
  // maîtrise pas : on le replace dès qu'il apparaît.
  watch(win, buttonId) {
    const { document } = win;
    const toolbar = document.getElementById("FormatToolbar");
    if (!toolbar) return;
    const place = () => {
      const button = document.getElementById(buttonId);
      const indent = document.getElementById("indentButton");
      if (button && indent && indent.nextElementSibling !== button) {
        indent.after(button);
      }
    };
    place();
    const observer = new win.MutationObserver(place);
    observer.observe(toolbar, { childList: true });
    this.observers.set(win, observer);
  }

  onShutdown(isAppShutdown) {
    if (isAppShutdown) return;
    if (this.listenerId) {
      ExtensionSupport.unregisterWindowListener(this.listenerId);
    }
    for (const observer of this.observers?.values() ?? []) {
      observer.disconnect();
    }
    // Sans cela, Thunderbird garde l'ancienne version du script en cache.
    Services.obs.notifyObservers(null, "startupcache-invalidate");
  }
};
