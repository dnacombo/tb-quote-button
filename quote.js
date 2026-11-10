(() => {
  // Le script est réinjecté à chaque clic : ne brancher l'écouteur qu'une fois.
  if (globalThis.quoteSelectionLoaded) return;
  globalThis.quoteSelectionLoaded = true;

  // Style en ligne pour que la barre s'affiche aussi chez les destinataires
  // (Gmail, Outlook...), qui ignorent le type="cite" de Thunderbird.
  const QUOTE_STYLE = "margin:0 0 0 .8ex; border-left:2px solid #ccc; padding-left:1ex;";

  // Reconnaît les citations créées par ce bouton (les citations de réponse n'ont pas de style en ligne).
  const isOurQuote = (el) => el.getAttribute("type") === "cite" && el.style.borderLeftStyle === "solid";

  // Vrai si le noeud est dans une citation du bouton (la plus interne décide).
  function inOurQuote(node) {
    for (let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement; el; el = el.parentElement) {
      if (el.localName === "blockquote") return isOurQuote(el);
    }
    return false;
  }

  // Mode HTML : Indent / Outdent natifs de l'éditeur, qui travaillent sur le paragraphe entier
  // et gardent la sélection, d'où la bascule possible en appuyant à nouveau.
  function toggleQuoteHtml() {
    const sel = getSelection();
    if (!sel.rangeCount) return;
    const { startContainer, startOffset } = sel.getRangeAt(0);
    const start =
      startContainer.nodeType === Node.ELEMENT_NODE ? startContainer.childNodes[startOffset] ?? startContainer : startContainer;
    if (inOurQuote(start)) {
      document.execCommand("outdent");
      return;
    }
    const existing = new Set(document.querySelectorAll("blockquote"));
    document.execCommand("indent");
    for (const quote of document.querySelectorAll("blockquote")) {
      if (existing.has(quote)) continue;
      quote.setAttribute("type", "cite");
      quote.setAttribute("style", QUOTE_STYLE);
    }
  }

  // Mode texte brut : ajoute ou retire un niveau de "> " sur les paragraphes sélectionnés.
  function toggleQuotePlain() {
    const sel = getSelection();
    if (!sel.rangeCount) return;
    // Étend la sélection aux paragraphes entiers (pas aux lignes visuelles).
    const { endContainer, endOffset } = sel.getRangeAt(0);
    sel.collapseToStart();
    sel.modify("move", "backward", "paragraphboundary");
    sel.extend(endContainer, endOffset);
    // Une sélection qui finit déjà au début de la ligne suivante est complète.
    if (!sel.toString().endsWith("\n")) sel.modify("extend", "forward", "paragraphboundary");

    const text = sel.toString();
    const trailingNewline = text.endsWith("\n");
    const lines = (trailingNewline ? text.slice(0, -1) : text).split("\n");
    const allQuoted = lines.every((line) => line.startsWith(">"));
    const result =
      lines
        .map((line) => {
          if (allQuoted) return line.replace(/^> ?/, "");
          return line.startsWith(">") ? ">" + line : "> " + line;
        })
        .join("\n") + (trailingNewline ? "\n" : "");
    document.execCommand("insertText", false, result);

    // Resélectionne le texte inséré pour que la pression suivante bascule à nouveau.
    for (let i = 0; i < result.length; i++) sel.modify("extend", "backward", "character");
  }

  browser.runtime.onMessage.addListener((message) => {
    if (message.action !== "quote") return;
    if (message.isPlainText) {
      toggleQuotePlain();
    } else {
      toggleQuoteHtml();
    }
  });
})();
