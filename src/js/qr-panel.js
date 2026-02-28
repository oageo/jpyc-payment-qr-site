const qrPlaceholder = document.getElementById("qr-placeholder");
const qrFigure = document.getElementById("qr-figure");
const qrImage = document.getElementById("qr-image");
const uriDisplay = document.getElementById("uri-display");
const uriText = document.getElementById("uri-text");
const copyButton = document.getElementById("copy-button");
const warningContainer = document.getElementById("warning-container");

export function showPlaceholder(message) {
	qrPlaceholder.textContent = message;
	qrPlaceholder.style.display = "";
	qrFigure.classList.remove("is-inline-block");
	qrFigure.style.display = "none";
	qrImage.removeAttribute("src");
}

export function showQR(dataUrl) {
	qrPlaceholder.style.display = "none";
	qrImage.src = dataUrl;
	qrFigure.style.removeProperty("display");
	qrFigure.classList.add("is-inline-block");
}

export function showURI(uri) {
	uriText.textContent = uri;
	uriDisplay.style.display = "";
}

export function hideURI() {
	uriDisplay.style.display = "none";
	uriText.textContent = "";
}

export function showWarnings(warnings) {
	warningContainer.innerHTML = "";
	if (!warnings || warnings.length === 0) return;
	for (const w of warnings) {
		const article = document.createElement("article");
		article.className = "message is-warning";
		article.innerHTML = `<div class="message-body">${w.message}</div>`;
		warningContainer.appendChild(article);
	}
}

export function initCopyButton() {
	copyButton.addEventListener("click", () => {
		const text = uriText.textContent;
		if (!text) return;
		navigator.clipboard.writeText(text).then(() => {
			copyButton.textContent = "コピーしました";
			setTimeout(() => {
				copyButton.textContent = "コピー";
			}, 1500);
		});
	});
}
