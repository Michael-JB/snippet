// Copyright (c) 2025 Michael Barlow

const getSnippet = () => document.getElementById("snippet");

const addInputListener = () => {
  const snippet = getSnippet();
  const onInput = debounce(async () => saveText(snippet), 200);
  snippet.addEventListener("input", onInput);
};

const loadText = async () => {
  snippet = getSnippet();
  snippet.focus();
  const payload = readURL();
  snippet.textContent = payload ? await decode(payload) : "";
};

const saveText = async (snippet) => writeURL(await encode(snippet.textContent));

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

const decode = async (encodedBytes) => {
  const bytes = Uint8Array.fromBase64(encodedBytes, { alphabet: "base64url" });
  const buffer = await feed(bytes, new DecompressionStream("deflate-raw"));
  return new TextDecoder().decode(buffer);
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
