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
  ".bm-account-phone{display:none}" +
  ".bm-account-phone>summary{list-style:none}" +
  ".bm-account-phone>summary::-webkit-details-marker{display:none}" +
  ".bm-account-toggle{position:relative;z-index:90}" +
  ".bm-shell{flex-wrap:nowrap}" +
  "[data-meetup-rail]{flex:1 1 0%;min-width:96px;position:sticky;top:0;align-self:flex-start;height:100vh;max-height:100vh;overflow-y:auto;box-sizing:border-box}" +
  "[data-home-shell]{display:grid!important;grid-template-columns:" +
  SIDEBAR_RAIL_BASIS +
  "px minmax(0," +
  SIDEBAR_DASH_MAX +
  "px) minmax(96px,1fr);grid-template-rows:minmax(0,1fr) auto;align-items:stretch}" +
  "[data-home-shell]>.bm-rail{grid-column:1;grid-row:1 / span 2}" +
  "[data-home-shell]>.bm-dash{grid-column:2;grid-row:1}" +
  "[data-home-shell]>[data-meetup-rail]{grid-column:3;grid-row:1 / span 2}" +
  "[data-home-shell]>[data-site-footer]{grid-column:2;grid-row:2}" +
  "@media (max-width:" +
  PHONE_ACCOUNT_BREAKPOINT +
  "px){" +
  ".bm-shell{flex-direction:column}" +
  "[data-home-shell]{display:flex!important;flex-direction:column;flex-wrap:nowrap}" +
  "[data-home-shell]>.bm-rail,[data-home-shell]>.bm-dash,[data-home-shell]>[data-meetup-rail],[data-home-shell]>[data-site-footer]{grid-column:auto;grid-row:auto}" +
  ".bm-rail{display:none!important}" +
  ".bm-account-phone{display:block}" +
  ".bm-account-toggle{display:inline-flex!important;gap:8px}" +
  ".bm-dash{flex:0 1 100%;width:100%;max-width:100%}" +
  ".bm-dash-inner{max-width:100%;padding-left:14px;padding-right:14px}" +
  ".bm-home-wordmark{font-size:22px!important}" +
  ".bm-header-mark{width:44px!important;height:44px!important}" +
  ".bm-pin-line{min-height:0!important;gap:8px}" +
  ".bm-pin-card{flex:0 0 122px!important;width:122px!important;max-width:122px!important}" +
  ".bm-pin-photo,.bm-pin-photo img{height:110px!important;min-height:110px!important}" +
  ".bm-shortlist-photo{width:140px!important;max-width:140px!important;height:168px!important;max-height:168px!important}" +
  ".bm-shortlist-name{font-size:20px!important}" +
  ".bm-plan-headline{font-size:20px!important}" +
  "[data-plan-card]{padding:16px 14px!important}" +
  "[data-meetup-rail]{display:block;flex:0 0 auto;width:100%!important;min-width:0!important;max-width:100%!important;padding:8px 14px 28px;overflow:visible;position:static!important;top:auto;align-self:stretch;height:auto!important;max-height:none!important;border-left:none!important}" +
  "[data-meetup-test-post] h2{font-size:18px!important}" +
  "}" +
  ".bm-account-overlay{transition:opacity .2s ease}" +
  ".bm-scrim{transition:opacity .2s ease}" +
  ".bm-input::placeholder{color:#B3A9B8}" +
  ".bm-input:focus{border-color:#6D28D9;background:#FDF8F1}" +
  ".bm-focus:focus-visible{outline:2px solid #6D28D9;outline-offset:2px}" +
  "@media (prefers-reduced-motion:reduce){.bm-card,.bm-talk,.bm-ghost,.bm-tab,.bm-menu,.bm-drawer,.bm-scrim,.bm-account-overlay{transition:none!important}}";
