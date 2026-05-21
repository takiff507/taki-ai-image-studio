const form = document.querySelector("#generator-form");
const promptInput = document.querySelector("#prompt");
const apiKeyInput = document.querySelector("#api-key");
const statusEl = document.querySelector("#status");
const imageEl = document.querySelector("#generated-image");
const emptyState = document.querySelector("#empty-state");
const loadingState = document.querySelector("#loading-state");
const downloadLink = document.querySelector("#download-link");
const copyUrlButton = document.querySelector("#copy-url-button");
const clearButton = document.querySelector("#clear-button");
const historyStrip = document.querySelector("#history-strip");
const generateButton = document.querySelector("#generate-button");

const stylePrompts = {
  realistic: "realistic detail, natural lighting, sharp focus",
  anime: "anime art style, expressive character design, clean linework",
  cinematic: "cinematic composition, dramatic light, high contrast",
  minimal: "minimal composition, clean shapes, balanced negative space",
};

const state = {
  lastUrl: "",
  lastObjectUrl: "",
  history: [],
};

const savedKey = localStorage.getItem("taki-pollinations-pk");
if (savedKey) {
  apiKeyInput.value = savedKey;
}

document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => {
    promptInput.value = button.dataset.prompt;
    promptInput.focus();
  });
});

apiKeyInput.addEventListener("change", () => {
  const value = apiKeyInput.value.trim();
  if (value && value.startsWith("pk_")) {
    localStorage.setItem("taki-pollinations-pk", value);
    setStatus("Publishable key saved on this browser.");
    return;
  }

  localStorage.removeItem("taki-pollinations-pk");
  if (value.startsWith("sk_")) {
    setStatus("Use a publishable pk_ key in browser apps, not a secret sk_ key.");
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await generateImage();
});

clearButton.addEventListener("click", () => {
  promptInput.value = "";
  apiKeyInput.value = "";
  localStorage.removeItem("taki-pollinations-pk");
  resetPreview();
  setStatus("Ready");
});

copyUrlButton.addEventListener("click", async () => {
  if (!state.lastUrl) {
    return;
  }

  await navigator.clipboard.writeText(state.lastUrl);
  setStatus("Image URL copied.");
});

async function generateImage() {
  const rawPrompt = promptInput.value.trim();
  if (!rawPrompt) {
    setStatus("Add a prompt first.");
    return;
  }

  const style = new FormData(form).get("style");
  const size = new FormData(form).get("size");
  const key = apiKeyInput.value.trim();

  if (key && !key.startsWith("pk_")) {
    setStatus("For browser use, add a publishable pk_ key or leave the field empty.");
    return;
  }

  const finalPrompt = [rawPrompt, stylePrompts[style]].filter(Boolean).join(", ");
  const url = buildImageUrl(finalPrompt, size);

  setBusy(true);
  setStatus("Generating image...");

  try {
    if (key) {
      await fetchWithPublishableKey(url, key, rawPrompt);
    } else {
      await loadPublicImage(url, rawPrompt);
    }

    state.lastUrl = url;
    copyUrlButton.disabled = false;
    setStatus("Done.");
  } catch (error) {
    resetPreview(false);
    setStatus(error.message || "Generation failed. Try a publishable key.");
  } finally {
    setBusy(false);
  }
}

function buildImageUrl(prompt, size) {
  const endpoint = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}`;
  const params = new URLSearchParams({
    model: "flux",
    size,
    safe: "true",
    nologo: "true",
  });

  return `${endpoint}?${params.toString()}`;
}

async function fetchWithPublishableKey(url, key, label) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${key}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Pollinations returned ${response.status}.`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  showImage(objectUrl, label);
}

function loadPublicImage(url, label) {
  return new Promise((resolve, reject) => {
    const testImage = new Image();
    testImage.crossOrigin = "anonymous";
    testImage.onload = () => {
      showImage(url, label);
      resolve();
    };
    testImage.onerror = () => {
      reject(new Error("Public generation needs a publishable Pollinations key."));
    };
    testImage.src = url;
  });
}

function showImage(src, label) {
  if (state.lastObjectUrl && state.lastObjectUrl.startsWith("blob:")) {
    URL.revokeObjectURL(state.lastObjectUrl);
  }

  state.lastObjectUrl = src;
  imageEl.src = src;
  imageEl.hidden = false;
  imageEl.alt = `Generated image for: ${label}`;
  emptyState.hidden = true;
  downloadLink.href = src;
  downloadLink.hidden = false;
  addHistory(src, label);
}

function addHistory(src, label) {
  state.history.unshift({ src, label });
  state.history = state.history.slice(0, 6);
  historyStrip.replaceChildren(
    ...state.history.map((item) => {
      const button = document.createElement("button");
      button.className = "history-item";
      button.type = "button";
      button.title = item.label;

      const image = document.createElement("img");
      image.src = item.src;
      image.alt = item.label;

      button.append(image);
      button.addEventListener("click", () => {
        imageEl.src = item.src;
        imageEl.hidden = false;
        emptyState.hidden = true;
        downloadLink.href = item.src;
        downloadLink.hidden = false;
      });
      return button;
    }),
  );
}

function resetPreview(clearHistory = true) {
  imageEl.removeAttribute("src");
  imageEl.hidden = true;
  emptyState.hidden = false;
  downloadLink.hidden = true;
  copyUrlButton.disabled = true;
  state.lastUrl = "";

  if (clearHistory) {
    state.history = [];
    historyStrip.replaceChildren();
  }
}

function setBusy(isBusy) {
  generateButton.disabled = isBusy;
  loadingState.hidden = !isBusy;
}

function setStatus(message) {
  statusEl.textContent = message;
}
