import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

// في الديمو: نخفي زرار جوجل لأنه مش هيشتغل من غير Client ID
const style = document.createElement("style");
style.textContent = ".google-auth-btn, .auth-divider { display: none !important; }";
document.head.appendChild(style);
