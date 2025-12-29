// Copyright (c) 2025 Michael Barlow

const getSnippet = () => document.getElementById("snippet");

const addInputListener = () => {
  const snippet = getSnippet();
  const onInput = debounce(() => saveText(snippet), 200);
  snippet.addEventListener("input", onInput);
};

const loadText = async () => {
  const snippet = getSnippet();
  snippet.focus();

  const payload = readURL();
  const decoded = payload ? await decode(payload) : undefined;

  if (payload && !decoded) {
    console.info("Invalid or corrupt URL payload. Double-check your link.");
    clearURL();
  }

  snippet.textContent = decoded ?? "";
};

const saveText = async (snippet) => {
  if (!snippet.textContent) {
    clearURL();
    return;
  }
  writeURL(await encode(snippet.textContent));
};

const clearURL = () => history.replaceState(null, "", location.pathname);

const writeURL = (payload) => {
  const hash = "#" + payload;
  if (location.hash !== hash) history.replaceState(null, "", hash);
};

const readURL = () => {
  const hash = location.hash;
  if (!hash.startsWith("#")) return undefined;
  return hash.slice(1);
};

const encode = async (text) => {
  const bytes = new TextEncoder().encode(text);
  const buffer = await feed(bytes, new CompressionStream("deflate-raw"));
  return new Uint8Array(buffer).toBase64({ alphabet: "base64url" });
};

const decode = async (encoded) => {
  try {
    const bytes = Uint8Array.fromBase64(encoded, { alphabet: "base64url" });
    const buffer = await feed(bytes, new DecompressionStream("deflate-raw"));
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch (e) {
    console.debug("Decoding failed:", e);
    return null;
  }
};

const feed = async (bytes, stream) => {
  const transformed = new Blob([bytes]).stream().pipeThrough(stream);
  return new Response(transformed).arrayBuffer();
};

const debounce = (callback, wait) => {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), wait);
  };
};

window.addEventListener("DOMContentLoaded", addInputListener);
window.addEventListener("DOMContentLoaded", loadText);
window.addEventListener("hashchange", loadText);
