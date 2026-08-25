export const VIOLET = "#6D28D9";
export const VIOLET_DEEP = "#4C1D95";
export const INK = "#1E1B36";
export const MUTED = "#7B6F8A";
export const LINE = "#E8DFD2";
export const WASH = "#F7F1E8";
export const CREAM = "#FDF8F1";
export const GOLD = "#C4A36A";

/** Capped rail. Capped dash. Right cream at 1280 is small to medium, not a 640 canyon. */
export const SIDEBAR_RAIL_BASIS = 240;
export const SIDEBAR_RAIL_MAX = 280;
export const SIDEBAR_RAIL_MIN = 220;
export const SIDEBAR_RAIL_SLIM = 148;
export const SIDEBAR_DASH_MAX = 920;
/** Phones and tablets hide the always-open rail. Desktop above this stays locked. */
export const PHONE_ACCOUNT_BREAKPOINT = 800;

export const BM_CSS =
  "@import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,300;6..72,400&family=Schibsted+Grotesk:wght@400;500;600&display=swap');" +
  ".bm-serif{font-family:'Newsreader',Georgia,serif}" +
  ".bm-sans{font-family:'Schibsted Grotesk',system-ui,sans-serif}" +
  "body{margin:0}" +
  ".bm-card{transition:border-color .2s ease,box-shadow .2s ease}" +
  ".bm-card:hover{border-color:#DDD2C3;box-shadow:0 10px 28px rgba(45,27,54,.08)}" +
  ".bm-tab{transition:color .18s ease}" +
  ".bm-talk{transition:transform .16s ease,background .2s ease}" +
  ".bm-talk:active{transform:scale(.985)}" +
  ".bm-ghost{transition:background .18s ease,border-color .18s ease}" +
  ".bm-ghost:hover{background:#F3EBE0;border-color:#DDD2C3}" +
  ".bm-menu{transition:background .18s ease,border-color .18s ease}" +
  ".bm-menu:hover{background:#F3EBE0}" +
  ".bm-drawer{transition:transform .2s ease}" +
  ".bm-rail{flex:0 0 " +
  SIDEBAR_RAIL_BASIS +
  "px;width:" +
  SIDEBAR_RAIL_BASIS +
  "px;min-width:" +
  SIDEBAR_RAIL_MIN +
  "px;max-width:" +
  SIDEBAR_RAIL_MAX +
  "px;box-sizing:border-box;display:flex;flex-direction:column}" +
  ".bm-dash{flex:0 1 " +
  SIDEBAR_DASH_MAX +
  "px;max-width:" +
  SIDEBAR_DASH_MAX +
  "px;min-width:0;display:flex;flex-direction:column}" +
  ".bm-dash-inner{width:100%;max-width:" +
  SIDEBAR_DASH_MAX +
  "px;margin:0;margin-right:auto;box-sizing:border-box}" +
  ".bm-account-toggle{display:none}" +
  "@media (max-width:" +
  PHONE_ACCOUNT_BREAKPOINT +
  "px){.bm-rail{display:none!important}.bm-account-toggle{display:inline-flex!important}[data-meetup-rail]{display:none!important}}" +
  ".bm-account-overlay{transition:opacity .2s ease}" +
  ".bm-scrim{transition:opacity .2s ease}" +
  ".bm-input::placeholder{color:#B3A9B8}" +
  ".bm-input:focus{border-color:#6D28D9;background:#FDF8F1}" +
  ".bm-focus:focus-visible{outline:2px solid #6D28D9;outline-offset:2px}" +
  "@media (prefers-reduced-motion:reduce){.bm-card,.bm-talk,.bm-ghost,.bm-tab,.bm-menu,.bm-drawer,.bm-scrim,.bm-account-overlay{transition:none!important}}";
