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
    // Grisé comme les autres boutons de mise en forme : on recopie l'état de
    // cmd_indent (désactivé tant que le curseur n'est pas dans le corps du
    // message). Thunderbird réécrit "disabled" quand il redessine le bouton
    // de l'addon : on surveille donc aussi le bouton pour réappliquer l'état.
    const command = document.getElementById("cmd_indent");
    const sync = () => {
      const button = document.getElementById(buttonId);
      if (!button || !command) return;
      // Thunderbird pose disabled="" (toggleAttribute), pas "true" : seule la présence compte.
      const disabled = command.hasAttribute("disabled") && command.getAttribute("disabled") !== "false";
      if (button.hasAttribute("disabled") !== disabled) {
        button.toggleAttribute("disabled", disabled);
      }
    };
    const update = () => {
      place();
      sync();
    };
    update();
    const observer = new win.MutationObserver(update);
    observer.observe(toolbar, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled"] });
    if (command) {
      observer.observe(command, { attributes: true, attributeFilter: ["disabled"] });
    }
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
