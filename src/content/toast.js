const TOAST_ROOT_ID = "screensense-zoom-toast-root";
const TOAST_TIMEOUT_MS = 2200;

const zoomPercentFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0
});

let toastRoot;
let toastTimer;

function removeToastRoot() {
  if (!toastRoot) {
    return;
  }

  window.clearTimeout(toastTimer);
  toastRoot.host.remove();
  toastRoot = undefined;
  toastTimer = undefined;
}

function getToastRoot() {
  if (toastRoot?.isConnected) {
    return toastRoot;
  }

  const host = document.createElement("div");
  host.id = TOAST_ROOT_ID;
  host.style.all = "initial";

  const shadowRoot = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial;
    }

    .toast {
      position: fixed;
      top: max(20px, env(safe-area-inset-top));
      right: max(20px, env(safe-area-inset-right));
      z-index: 2147483647;
      display: grid;
      gap: 2px;
      min-width: 184px;
      padding: 12px 14px;
      border: 1px solid rgba(255, 255, 255, 0.24);
      border-radius: 16px;
      background:
        linear-gradient(135deg, rgba(21, 28, 40, 0.95), rgba(41, 56, 80, 0.92));
      box-shadow:
        0 18px 40px rgba(8, 12, 20, 0.28),
        inset 0 1px 0 rgba(255, 255, 255, 0.12);
      color: #f4f8ff;
      font-family:
        "IBM Plex Sans",
        "Avenir Next",
        "Segoe UI",
        sans-serif;
      font-variant-numeric: tabular-nums;
      opacity: 0;
      transform: translateY(-10px) scale(0.96);
      transition:
        opacity 160ms ease,
        transform 160ms ease;
      pointer-events: none;
      backdrop-filter: blur(16px);
    }

    .toast[data-visible="true"] {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    .eyebrow {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(196, 222, 255, 0.72);
    }

    .value {
      font-size: 24px;
      font-weight: 700;
      line-height: 1.05;
      letter-spacing: -0.03em;
      color: #ffffff;
    }

    @media (prefers-reduced-motion: reduce) {
      .toast {
        transform: none;
        transition: opacity 120ms ease;
      }

      .toast[data-visible="true"] {
        transform: none;
      }
    }
  `;

  const toast = document.createElement("section");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");

  const eyebrow = document.createElement("div");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "Page Zoom";

  const value = document.createElement("div");
  value.className = "value";

  toast.append(eyebrow, value);
  shadowRoot.append(style, toast);
  document.documentElement.append(host);

  toastRoot = { host, toast, value };
  return toastRoot;
}

export function showZoomToast({ isSupportedZoomFactor, zoomPercent }) {
  removeToastRoot();

  const { toast, value } = getToastRoot();
  const formattedZoomPercent = zoomPercentFormatter.format(zoomPercent);
  const suffix = isSupportedZoomFactor ? "" : " (Unsupported)";

  value.textContent = `${formattedZoomPercent}%${suffix}`;
  toast.dataset.visible = "true";

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.dataset.visible = "false";
  }, TOAST_TIMEOUT_MS);
}
