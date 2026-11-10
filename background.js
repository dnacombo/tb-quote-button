const SCRIPT_ID = "quote-selection";

// Injecte quote.js dans l'éditeur de toutes les fenêtres de composition
// ouvertes à partir de maintenant. L'enregistrement dure autant que l'extension.
async function registerComposeScript() {
  const registered = await messenger.scripting.compose.getRegisteredScripts({ ids: [SCRIPT_ID] });
  if (registered.length) return;
  await messenger.scripting.compose.registerScripts([{ id: SCRIPT_ID, js: ["quote.js"] }]);
}

registerComposeScript().catch((error) => console.error("Quote Selection : enregistrement du script", error));

// Positionnement du bouton : sans effet sur le reste si l'API échoue.
messenger.quoteButtonPlacement.start().catch((error) => console.error("Quote Selection : placement du bouton", error));

messenger.composeAction.onClicked.addListener(async (tab) => {
  try {
    const { isPlainText } = await messenger.compose.getComposeDetails(tab.id);
    const message = { action: "quote", isPlainText };
    try {
      await messenger.tabs.sendMessage(tab.id, message);
    } catch (error) {
      // Fenêtre ouverte avant l'enregistrement du script : injection à la main.
      await messenger.scripting.executeScript({ target: { tabId: tab.id }, files: ["quote.js"] });
      await messenger.tabs.sendMessage(tab.id, message);
    }
  } catch (error) {
    console.error("Quote Selection :", error);
  }
});
