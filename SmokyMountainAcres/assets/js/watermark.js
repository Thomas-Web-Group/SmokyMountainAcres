(() => {
  "use strict";

  const DEFAULTS = Object.freeze({
    size: 30,
    color: "auto",
    position: "bottom-right",
    opacity: 80,
    padding: 3,
  });
  const STORAGE_KEY = "sma-watermark-settings";
  const MAX_EXPORT_PIXELS = 20_000_000;
  const MAX_EXPORT_DIMENSION = 12_000;
  const MAX_PREVIEW_PIXELS = 1_800_000;
  const MAX_PREVIEW_DIMENSION = 1_400;
  const VALID_COLORS = new Set(["auto", "black", "white"]);
  const VALID_POSITIONS = new Set(["bottom-right", "bottom-left", "top-right", "top-left"]);

  const elements = {
    input: document.querySelector("#photo-input"),
    choose: document.querySelector("#choose-photos"),
    dropZone: document.querySelector("#drop-zone"),
    count: document.querySelector("#photo-count"),
    listSection: document.querySelector("#photo-list-section"),
    list: document.querySelector("#photo-list"),
    previewCanvas: document.querySelector("#preview-canvas"),
    emptyPreview: document.querySelector("#empty-preview"),
    previewDetails: document.querySelector("#preview-details"),
    colorStatus: document.querySelector("#watermark-color-status"),
    size: document.querySelector("#size-setting"),
    sizeValue: document.querySelector("#size-value"),
    color: document.querySelector("#color-setting"),
    position: document.querySelector("#position-setting"),
    opacity: document.querySelector("#opacity-setting"),
    opacityValue: document.querySelector("#opacity-value"),
    padding: document.querySelector("#padding-setting"),
    paddingValue: document.querySelector("#padding-value"),
    reset: document.querySelector("#reset-settings"),
    save: document.querySelector("#save-photo"),
    share: document.querySelector("#share-photo"),
    message: document.querySelector("#app-message"),
  };

  const logo = new Image();
  logo.src = "/assets/img/sma-logo.png";

  let logoCanvas;
  let logoPixels;
  let logoBounds;
  let whiteLogoCanvas;
  let entries = [];
  let activeEntry = null;
  let activeImage = null;
  let activeRequest = 0;
  let previewFrame = 0;
  let busy = false;
  let logoError = "";
  let settings = loadSettings();

  function setMessage(message, tone = "") {
    elements.message.textContent = message;
    elements.message.dataset.tone = tone;
  }

  function readSettings(value) {
    if (!value || typeof value !== "object") return { ...DEFAULTS };
    return {
      size: clampNumber(value.size, 15, 50, DEFAULTS.size),
      color: VALID_COLORS.has(value.color) ? value.color : DEFAULTS.color,
      position: VALID_POSITIONS.has(value.position) ? value.position : DEFAULTS.position,
      opacity: clampNumber(value.opacity, 20, 100, DEFAULTS.opacity),
      padding: clampNumber(value.padding, 0, 10, DEFAULTS.padding),
    };
  }

  function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
  }

  function loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? readSettings(JSON.parse(saved)) : { ...DEFAULTS };
    } catch (error) {
      window.setTimeout(() => setMessage("Saved settings could not be read. Defaults are in use for this visit.", "error"), 0);
      return { ...DEFAULTS };
    }
  }

  function persistSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      setMessage("Your browser could not save these settings. They will still work until you leave this page.", "error");
    }
  }

  function updateSettingControls() {
    elements.size.value = settings.size;
    elements.sizeValue.value = `${settings.size}%`;
    elements.color.value = settings.color;
    elements.position.value = settings.position;
    elements.opacity.value = settings.opacity;
    elements.opacityValue.value = `${settings.opacity}%`;
    elements.padding.value = settings.padding;
    elements.paddingValue.value = `${settings.padding}%`;
  }

  function initializeLogo() {
    if (!logo.complete || !logo.naturalWidth) {
      throw new Error("The Smoky Mountain Acres logo could not be loaded.");
    }
    logoCanvas = document.createElement("canvas");
    logoCanvas.width = logo.naturalWidth;
    logoCanvas.height = logo.naturalHeight;
    const context = logoCanvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("This browser could not prepare the watermark logo.");
    context.drawImage(logo, 0, 0);
    logoPixels = context.getImageData(0, 0, logoCanvas.width, logoCanvas.height);

    let left = logoCanvas.width;
    let top = logoCanvas.height;
    let right = 0;
    let bottom = 0;
    for (let y = 0; y < logoCanvas.height; y += 1) {
      for (let x = 0; x < logoCanvas.width; x += 1) {
        if (logoPixels.data[(y * logoCanvas.width + x) * 4 + 3] <= 16) continue;
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x + 1);
        bottom = Math.max(bottom, y + 1);
      }
    }
    if (right <= left || bottom <= top) throw new Error("The watermark logo has no visible artwork.");
    logoBounds = { left, top, right, bottom, width: right - left, height: bottom - top };

    whiteLogoCanvas = document.createElement("canvas");
    whiteLogoCanvas.width = logoCanvas.width;
    whiteLogoCanvas.height = logoCanvas.height;
    const whiteContext = whiteLogoCanvas.getContext("2d");
    if (!whiteContext) throw new Error("This browser could not prepare the white watermark.");
    const whitePixels = whiteContext.createImageData(logoPixels.width, logoPixels.height);
    for (let index = 0; index < logoPixels.data.length; index += 4) {
      whitePixels.data[index] = 255;
      whitePixels.data[index + 1] = 255;
      whitePixels.data[index + 2] = 255;
      whitePixels.data[index + 3] = logoPixels.data[index + 3];
    }
    whiteContext.putImageData(whitePixels, 0, 0);
  }

  function drawDimensions(width, height, maxPixels, maxDimension) {
    const scale = Math.min(1, Math.sqrt(maxPixels / (width * height)), maxDimension / Math.max(width, height));
    return {
      width: Math.max(1, Math.floor(width * scale)),
      height: Math.max(1, Math.floor(height * scale)),
      scale,
    };
  }

  function placementFor(width, height) {
    const shortestSide = Math.min(width, height);
    const padding = shortestSide * (settings.padding / 100);
    const requestedSize = shortestSide * (settings.size / 100);
    const widestBound = Math.max(logoBounds.width, logoBounds.height);
    const maxScale = Math.min(
      (width - padding * 2) / logoBounds.width,
      (height - padding * 2) / logoBounds.height,
    );
    const scale = Math.max(0, Math.min(requestedSize / widestBound, maxScale));
    const drawWidth = logoCanvas.width * scale;
    const drawHeight = logoCanvas.height * scale;
    const position = settings.position.split("-");
    const horizontal = position[1];
    const vertical = position[0];
    const x = horizontal === "left"
      ? padding - logoBounds.left * scale
      : width - padding - logoBounds.right * scale;
    const y = vertical === "top"
      ? padding - logoBounds.top * scale
      : height - padding - logoBounds.bottom * scale;

    return { x, y, width: drawWidth, height: drawHeight, scale };
  }

  function relativeLuminance(red, green, blue) {
    const linear = (channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
  }

  function contrastRatio(luminance, foreground) {
    const lighter = Math.max(luminance, foreground);
    const darker = Math.min(luminance, foreground);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function chooseAutomaticColor(photoContext, width, height, placement) {
    const left = Math.max(0, Math.floor(placement.x + logoBounds.left * placement.scale));
    const top = Math.max(0, Math.floor(placement.y + logoBounds.top * placement.scale));
    const right = Math.min(width, Math.ceil(placement.x + logoBounds.right * placement.scale));
    const bottom = Math.min(height, Math.ceil(placement.y + logoBounds.bottom * placement.scale));
    const patchWidth = right - left;
    const patchHeight = bottom - top;
    if (patchWidth <= 0 || patchHeight <= 0) return "black";

    const photoPixels = photoContext.getImageData(left, top, patchWidth, patchHeight);
    const step = Math.max(1, Math.floor(Math.max(patchWidth, patchHeight) / 160));
    let blackScore = 0;
    let whiteScore = 0;
    let totalWeight = 0;
    for (let y = 0; y < patchHeight; y += step) {
      const logoY = Math.floor((top + y + 0.5 - placement.y) / placement.scale);
      if (logoY < logoBounds.top || logoY >= logoBounds.bottom) continue;
      for (let x = 0; x < patchWidth; x += step) {
        const logoX = Math.floor((left + x + 0.5 - placement.x) / placement.scale);
        if (logoX < logoBounds.left || logoX >= logoBounds.right) continue;
        const logoAlpha = logoPixels.data[(logoY * logoCanvas.width + logoX) * 4 + 3] / 255;
        if (logoAlpha <= 16 / 255) continue;

        const photoIndex = (y * patchWidth + x) * 4;
        const photoAlpha = photoPixels.data[photoIndex + 3] / 255;
        const red = photoPixels.data[photoIndex] * photoAlpha + 255 * (1 - photoAlpha);
        const green = photoPixels.data[photoIndex + 1] * photoAlpha + 255 * (1 - photoAlpha);
        const blue = photoPixels.data[photoIndex + 2] * photoAlpha + 255 * (1 - photoAlpha);
        const luminance = relativeLuminance(red, green, blue);
        blackScore += contrastRatio(luminance, 0) * logoAlpha;
        whiteScore += contrastRatio(luminance, 1) * logoAlpha;
        totalWeight += logoAlpha;
      }
    }
    if (!totalWeight) return "black";
    return whiteScore > blackScore ? "white" : "black";
  }

  function drawWatermark(photoContext, width, height) {
    const placement = placementFor(width, height);
    const color = settings.color === "auto"
      ? chooseAutomaticColor(photoContext, width, height, placement)
      : settings.color;
    photoContext.save();
    photoContext.globalAlpha = settings.opacity / 100;
    photoContext.imageSmoothingEnabled = true;
    photoContext.imageSmoothingQuality = "high";
    photoContext.drawImage(
      color === "white" ? whiteLogoCanvas : logoCanvas,
      placement.x,
      placement.y,
      placement.width,
      placement.height,
    );
    photoContext.restore();
    return color;
  }

  function updateColorStatus(color) {
    elements.colorStatus.textContent = settings.color === "auto"
      ? `Auto chose ${color} for the best contrast.`
      : `${color[0].toUpperCase()}${color.slice(1)} watermark selected.`;
  }

  function renderPreview() {
    if (!activeImage || !logoCanvas) return;
    try {
      const dimensions = drawDimensions(
        activeImage.width,
        activeImage.height,
        MAX_PREVIEW_PIXELS,
        MAX_PREVIEW_DIMENSION,
      );
      const canvas = elements.previewCanvas;
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const context = canvas.getContext("2d", { willReadFrequently: settings.color === "auto" });
      if (!context) throw new Error("This browser could not draw a photo preview.");
      context.drawImage(activeImage, 0, 0, dimensions.width, dimensions.height);
      const color = drawWatermark(context, dimensions.width, dimensions.height);
      elements.emptyPreview.hidden = true;
      canvas.hidden = false;
      elements.previewDetails.textContent = `${activeEntry.file.name} · ${activeImage.width.toLocaleString()} × ${activeImage.height.toLocaleString()}`;
      updateColorStatus(color);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The photo preview could not be updated.", "error");
    }
  }

  function schedulePreview() {
    if (!activeImage) return;
    cancelAnimationFrame(previewFrame);
    previewFrame = requestAnimationFrame(renderPreview);
  }

  function isSupportedImage(file) {
    const type = file.type.toLowerCase();
    const extension = file.name.toLowerCase().match(/\.(jpe?g|png|webp)$/);
    return ["image/jpeg", "image/png", "image/webp"].includes(type)
      || Boolean(extension);
  }

  function decodeWithImageElement(file) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        if (!image.naturalWidth || !image.naturalHeight) {
          reject(new Error("The selected file does not contain a readable photo."));
          return;
        }
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("This photo could not be opened. Try saving it as a JPEG, PNG or WebP image."));
      };
      image.src = objectUrl;
    });
  }

  async function decodeImage(file) {
    if (typeof createImageBitmap === "function") {
      try {
        return await createImageBitmap(file, { imageOrientation: "from-image" });
      } catch (optionsError) {
        try {
          return await createImageBitmap(file);
        } catch (decodeError) {
          return decodeWithImageElement(file);
        }
      }
    }
    return decodeWithImageElement(file);
  }

  function releaseImage(image) {
    if (image && typeof image.close === "function") image.close();
  }

  function makeThumbnail(image) {
    const dimensions = drawDimensions(image.width, image.height, 10_000, 160);
    const canvas = document.createElement("canvas");
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not make a photo thumbnail.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.78);
  }

  function updatePhotoList() {
    elements.list.replaceChildren();
    elements.listSection.hidden = entries.length < 2;
    elements.count.textContent = entries.length
      ? `${entries.length} ${entries.length === 1 ? "photo" : "photos"} selected`
      : "";

    for (const entry of entries) {
      const item = document.createElement("li");
      item.className = `photo-list-item${entry === activeEntry ? " is-active" : ""}`;

      const selectButton = document.createElement("button");
      selectButton.className = "photo-select";
      selectButton.type = "button";
      selectButton.dataset.action = "select";
      selectButton.dataset.id = entry.id;
      selectButton.setAttribute("aria-pressed", String(entry === activeEntry));
      selectButton.disabled = busy || Boolean(entry.error);

      if (entry.thumbnail) {
        const thumbnail = document.createElement("img");
        thumbnail.className = "photo-thumbnail";
        thumbnail.src = entry.thumbnail;
        thumbnail.alt = "";
        selectButton.append(thumbnail);
      } else {
        const placeholder = document.createElement("span");
        placeholder.className = "photo-thumbnail";
        placeholder.setAttribute("aria-hidden", "true");
        selectButton.append(placeholder);
      }

      const name = document.createElement("span");
      name.className = "photo-name";
      name.textContent = entry.file.name;
      if (entry.error) {
        const errorText = document.createElement("span");
        errorText.className = "photo-error";
        errorText.textContent = entry.error;
        name.append(errorText);
      }
      selectButton.append(name);
      item.append(selectButton);

      const removeButton = document.createElement("button");
      removeButton.className = "remove-photo";
      removeButton.type = "button";
      removeButton.dataset.action = "remove";
      removeButton.dataset.id = entry.id;
      removeButton.disabled = busy;
      removeButton.setAttribute("aria-label", `Remove ${entry.file.name}`);
      removeButton.textContent = "×";
      item.append(removeButton);
      elements.list.append(item);
    }
    elements.share.disabled = busy || !activeImage || !logoCanvas;
    elements.save.disabled = busy || !activeImage || !logoCanvas;
  }

  function setBusy(value) {
    busy = value;
    elements.input.disabled = value;
    elements.choose.disabled = value;
    elements.reset.disabled = value;
    for (const control of [elements.size, elements.color, elements.position, elements.opacity, elements.padding]) {
      control.disabled = value;
    }
    updatePhotoList();
  }

  async function selectPhoto(entry) {
    if (busy || entry.error) return;
    const request = ++activeRequest;
    releaseImage(activeImage);
    activeImage = null;
    activeEntry = entry;
    elements.previewCanvas.hidden = true;
    elements.emptyPreview.hidden = false;
    elements.previewDetails.textContent = "Preparing your photo…";
    elements.colorStatus.textContent = "";
    elements.save.disabled = true;
    elements.share.disabled = true;
    updatePhotoList();

    try {
      const image = await decodeImage(entry.file);
      if (request !== activeRequest) {
        releaseImage(image);
        return;
      }
      activeImage = image;
      renderPreview();
      elements.save.disabled = !logoCanvas;
      elements.share.disabled = !logoCanvas;
      if (logoError) setMessage(logoError, "error");
      else if (!logoCanvas) setMessage("Loading the farm logo…");
      else setMessage("", "");
    } catch (error) {
      if (request !== activeRequest) return;
      entry.error = error instanceof Error ? error.message : "This photo could not be opened.";
      elements.previewDetails.textContent = "This photo could not be opened.";
      setMessage(entry.error, "error");
      updatePhotoList();
    }
  }

  async function addPhotos(files) {
    if (busy || !files.length) return;
    const accepted = [];
    const rejected = [];
    for (const file of files) {
      if (!isSupportedImage(file)) {
        rejected.push(file.name);
        continue;
      }
      if (entries.some((entry) => entry.file.name === file.name && entry.file.size === file.size && entry.file.lastModified === file.lastModified)) {
        continue;
      }
      accepted.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        thumbnail: "",
        error: "",
      });
    }
    entries.push(...accepted);
    updatePhotoList();
    elements.input.value = "";

    const preparationErrors = [];
    for (const entry of accepted) {
      let image;
      try {
        image = await decodeImage(entry.file);
        entry.thumbnail = makeThumbnail(image);
      } catch (error) {
        entry.error = error instanceof Error ? error.message : "This photo could not be opened.";
        preparationErrors.push(`${entry.file.name}: ${entry.error}`);
      } finally {
        releaseImage(image);
      }
      updatePhotoList();
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }

    const firstNewPhoto = accepted.find((entry) => !entry.error);
    if (!activeImage && firstNewPhoto) await selectPhoto(firstNewPhoto);
    if (rejected.length || preparationErrors.length) {
      const messages = [];
      if (rejected.length) messages.push(`Unsupported format${rejected.length > 1 ? "s" : ""}: ${rejected.join(", ")}. Choose JPEG, PNG or WebP photos.`);
      if (preparationErrors.length) messages.push(...preparationErrors);
      setMessage(messages.join(" "), "error");
    } else if (!accepted.length) {
      setMessage("Those photos are already in your list.", "");
    } else if (activeImage) {
      setMessage("", "");
    }
  }

  function removePhoto(id) {
    if (busy) return;
    const index = entries.findIndex((entry) => entry.id === id);
    if (index < 0) return;
    const [removed] = entries.splice(index, 1);
    if (removed === activeEntry) {
      activeRequest += 1;
      releaseImage(activeImage);
      activeImage = null;
      activeEntry = null;
      elements.previewCanvas.hidden = true;
      elements.emptyPreview.hidden = false;
      elements.previewDetails.textContent = "Your watermarked photo will appear here.";
      elements.colorStatus.textContent = "";
      const next = entries[index] || entries[index - 1];
      if (next && !next.error) selectPhoto(next);
    }
    updatePhotoList();
  }

  function outputFormat(file) {
    const isPng = file.type.toLowerCase() === "image/png" || /\.png$/i.test(file.name);
    return isPng
      ? { mime: "image/png", extension: "png" }
      : { mime: "image/jpeg", extension: "jpg" };
  }

  function outputFilename(file, extension) {
    const base = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
      .replace(/[. ]+$/g, "")
      .trim() || "photo";
    return `${base}-watermarked.${extension}`;
  }

  function canvasBlob(canvas, mime) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob && blob.type === mime) resolve(blob);
        else if (blob) reject(new Error(`Your browser exported ${blob.type || "an unknown image format"} instead of ${mime}.`));
        else reject(new Error("Your browser could not create the finished photo. Try a smaller image."));
      }, mime, mime === "image/jpeg" ? 0.92 : undefined);
    });
  }

  async function makeExport(file, image) {
    const format = outputFormat(file);
    const dimensions = drawDimensions(
      image.width,
      image.height,
      MAX_EXPORT_PIXELS,
      MAX_EXPORT_DIMENSION,
    );
    const canvas = document.createElement("canvas");
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext("2d", { willReadFrequently: settings.color === "auto" });
    if (!context) throw new Error("This browser could not prepare the finished photo.");
    if (format.mime === "image/jpeg") {
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const color = drawWatermark(context, canvas.width, canvas.height);
    const blob = await canvasBlob(canvas, format.mime);
    return {
      blob,
      filename: outputFilename(file, format.extension),
      color,
      resized: dimensions.scale < 1,
    };
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function processActivePhoto(share) {
    if (busy || !activeEntry || !activeImage) return;
    const file = activeEntry.file;
    const image = activeImage;
    setBusy(true);
    setMessage("Preparing your full-resolution photo…");
    try {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const result = await makeExport(file, image);
      const suffix = result.resized ? " This very large photo was safely resized for your device." : "";
      if (share && typeof navigator.share === "function" && typeof navigator.canShare === "function") {
        const shareFile = new File([result.blob], result.filename, { type: result.blob.type });
        let canShareFiles = false;
        let shareCheckFailed = false;
        try {
          canShareFiles = navigator.canShare({ files: [shareFile] });
        } catch (error) {
          shareCheckFailed = true;
        }
        if (canShareFiles) {
          try {
            await navigator.share({ files: [shareFile], title: "Smoky Mountain Acres photo" });
            setMessage(`Photo shared.${suffix}`, "success");
          } catch (error) {
            if (error && error.name === "AbortError") {
              setMessage("Sharing was canceled. Your photo was not changed.");
            } else {
              downloadBlob(result.blob, result.filename);
              setMessage(`Your browser could not open the share menu, so the photo was downloaded instead.${suffix}`, "success");
            }
          }
        } else {
          downloadBlob(result.blob, result.filename);
          const fallbackMessage = shareCheckFailed
            ? "Your browser could not confirm image sharing support, so the photo was downloaded instead."
            : "Photo sharing is not supported here, so the image was downloaded instead.";
          setMessage(`${fallbackMessage}${suffix}`, "success");
        }
      } else if (share) {
        downloadBlob(result.blob, result.filename);
        setMessage(`Photo sharing is not supported here, so the image was downloaded instead.${suffix}`, "success");
      } else {
        downloadBlob(result.blob, result.filename);
        setMessage(`Saved ${result.filename}.${suffix}`, "success");
      }
      updateColorStatus(result.color);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The photo could not be processed.", "error");
    } finally {
      setBusy(false);
    }
  }

  function updateSettingsFromControls() {
    settings = {
      size: Number(elements.size.value),
      color: elements.color.value,
      position: elements.position.value,
      opacity: Number(elements.opacity.value),
      padding: Number(elements.padding.value),
    };
    elements.sizeValue.value = `${settings.size}%`;
    elements.opacityValue.value = `${settings.opacity}%`;
    elements.paddingValue.value = `${settings.padding}%`;
    persistSettings();
    schedulePreview();
  }

  function resetSettings() {
    settings = { ...DEFAULTS };
    updateSettingControls();
    try {
      localStorage.removeItem(STORAGE_KEY);
      setMessage("Watermark settings reset to their defaults.", "success");
    } catch (error) {
      setMessage("Settings were reset for this visit, but your browser could not clear the saved settings.", "error");
    }
    schedulePreview();
  }

  function handleListClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button || busy) return;
    const entry = entries.find((item) => item.id === button.dataset.id);
    if (!entry) return;
    if (button.dataset.action === "select") selectPhoto(entry);
    if (button.dataset.action === "remove") removePhoto(entry.id);
  }

  function handleDrop(event) {
    event.preventDefault();
    elements.dropZone.classList.remove("is-dragging");
    addPhotos(Array.from(event.dataTransfer.files));
  }

  function initialize() {
    updateSettingControls();
    updatePhotoList();

    logo.addEventListener("load", () => {
      try {
        initializeLogo();
        if (activeImage) {
          renderPreview();
          updatePhotoList();
          setMessage("", "");
        }
      } catch (error) {
        logoError = error instanceof Error ? error.message : "The watermark logo could not be prepared.";
        setMessage(error instanceof Error ? error.message : "The watermark logo could not be prepared.", "error");
      }
    }, { once: true });
    logo.addEventListener("error", () => {
      logoError = "The Smoky Mountain Acres logo could not be loaded. Refresh the page and try again.";
      setMessage(logoError, "error");
    }, { once: true });
    if (logo.complete && logo.naturalWidth) {
      try {
        initializeLogo();
        if (activeImage) {
          renderPreview();
          updatePhotoList();
          setMessage("", "");
        }
      } catch (error) {
        logoError = error instanceof Error ? error.message : "The watermark logo could not be prepared.";
        setMessage(error instanceof Error ? error.message : "The watermark logo could not be prepared.", "error");
      }
    } else if (logo.complete) {
      logoError = "The Smoky Mountain Acres logo could not be loaded. Refresh the page and try again.";
      setMessage(logoError, "error");
    }

    elements.choose.addEventListener("click", () => elements.input.click());
    elements.input.addEventListener("change", () => addPhotos(Array.from(elements.input.files || [])));
    elements.list.addEventListener("click", handleListClick);
    elements.dropZone.addEventListener("dragover", (event) => {
      event.preventDefault();
      elements.dropZone.classList.add("is-dragging");
    });
    elements.dropZone.addEventListener("dragleave", (event) => {
      if (!elements.dropZone.contains(event.relatedTarget)) elements.dropZone.classList.remove("is-dragging");
    });
    elements.dropZone.addEventListener("drop", handleDrop);
    for (const control of [elements.size, elements.color, elements.position, elements.opacity, elements.padding]) {
      control.addEventListener(control.type === "range" ? "input" : "change", updateSettingsFromControls);
    }
    elements.reset.addEventListener("click", resetSettings);
    elements.save.addEventListener("click", () => processActivePhoto(false));
    elements.share.addEventListener("click", () => processActivePhoto(true));
  }

  initialize();
})();
