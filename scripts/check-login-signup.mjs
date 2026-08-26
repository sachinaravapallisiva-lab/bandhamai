import { existsSync, readFileSync } from "node:fs";
import {
  LOGIN_AGE_NOTE,
  LOGIN_CREATED_CONFIRM,
  LOGIN_CREATED_SESSION,
  LOGIN_EMPTY_FIELDS,
  LOGIN_FORGOT_LABEL,
  LOGIN_FORGOT_SENT,
  LOGIN_PRIVACY_PATH,
  LOGIN_PRODUCT,
  LOGIN_RESEND_LABEL,
  LOGIN_RESEND_SENT,
  LOGIN_SIGN_IN_HEADING,
  LOGIN_SIGN_IN_HELP,
  LOGIN_SIGN_IN_LABEL,
  LOGIN_SIGN_UP_API,
  LOGIN_SIGN_UP_HEADING,
  LOGIN_SIGN_UP_HELP,
  LOGIN_SIGN_UP_LABEL,
  LOGIN_SIGN_UP_PATH,
  LOGIN_SIGN_UP_PROMPT,
  LOGIN_TAGLINE,
  LOGIN_TERMS_AGREE,
  LOGIN_TERMS_NEED,
  LOGIN_TERMS_PATH,
  canCreateSignUpAccount,
  decideSignInIntent,
  decideSignUpIntent,
  hasLoginCredentials,
  loginHeading,
  loginHelp,
  loginPageModeFromSearch,
  loginUserCopy,
} from "../lib/login-auth.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function read(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

const page = read("app/login/page.tsx");
const helpers = read("lib/login-auth.ts");
const chrome = read("app/components/AppChrome.tsx");
const layout = read("app/login/layout.tsx");
const src = stripComments(page);

assert(!existsSync(new URL("../app/signup/page.tsx", import.meta.url)), "do not invent a second signup page");
assert(!existsSync(new URL("../app/sign-up/page.tsx", import.meta.url)), "do not invent a hyphen signup route");

assert(LOGIN_PRODUCT === "Bandham AI", "product is Bandham AI two words");
assert(LOGIN_TAGLINE === "Find your vibe match?", "tagline lock");
assert(LOGIN_SIGN_IN_HEADING === "Sign in", "sign in heading");
assert(LOGIN_SIGN_UP_HEADING === "Sign up", "sign up heading");
assert(LOGIN_SIGN_IN_LABEL === "Sign in", "sign in button");
assert(LOGIN_SIGN_UP_LABEL === "Sign up", "sign up button");
assert(LOGIN_EMPTY_FIELDS === "Enter an email and password.", "empty sign in copy stays");
assert(LOGIN_SIGN_UP_PROMPT !== LOGIN_EMPTY_FIELDS, "signup prompt is not the dead sign in error");
assert(LOGIN_SIGN_UP_HELP.toLowerCase().includes("create"), "signup helper is about creating an account");
assert(LOGIN_SIGN_UP_HELP.includes("Bandham AI"), "signup helper names Bandham AI");
assert(LOGIN_CREATED_SESSION.includes("signed in"), "session signup still continues");
assert(LOGIN_CREATED_CONFIRM.toLowerCase().includes("email"), "confirm signup still mentions email");
assert(LOGIN_FORGOT_LABEL === "Forgot password", "forgot stays");
assert(LOGIN_RESEND_LABEL === "Resend confirmation", "resend stays");
assert(LOGIN_AGE_NOTE.includes("18 and over"), "age 18+ stays public");
assert(LOGIN_AGE_NOTE.includes("Bandham AI"), "age note names Bandham AI");
assert(!/Supabase|allow-list|this page does not turn it on/i.test(LOGIN_AGE_NOTE), "age note is member facing");
assert(LOGIN_FORGOT_SENT.toLowerCase().includes("reset link"), "forgot success stays honest");
assert(!/Supabase|allow-list/i.test(LOGIN_FORGOT_SENT), "forgot success hides internals");
assert(LOGIN_RESEND_SENT.toLowerCase().includes("email"), "resend stays honest about email");
assert(!/Supabase|this project|allow-list/i.test(LOGIN_RESEND_SENT), "resend hides internals");
assert(LOGIN_SIGN_UP_PATH === "/login?mode=signup", "signup lives on login");
assert(loginPageModeFromSearch("signup") === "signup", "mode=signup is Sign up");
assert(loginPageModeFromSearch("reset") === "reset", "mode=reset stays reset");
assert(loginPageModeFromSearch("signin") === "signin", "unknown mode is Sign in");
assert(loginPageModeFromSearch(null) === "signin", "empty mode is Sign in");

loginUserCopy().forEach(function (text) {
  assert(!/[-–—]/.test(text), "login copy has no hyphen or dash: " + text);
  assert(!/Bandhamai|bandhamAI|Bandhan\b/.test(text), "never Bandhamai, bandhamAI, or Bandhan: " + text);
  assert(!/\$9\.99/.test(text), "do not say subscription is $9.99 for messaging");
});

assert(hasLoginCredentials("", "") === false, "empty is not credentials");
assert(hasLoginCredentials("  ", "") === false, "whitespace email is not credentials");
assert(hasLoginCredentials("sai@example.com", "") === false, "password required");
assert(hasLoginCredentials("sai@example.com", "secret") === true, "both fields count");

assert(decideSignUpIntent("signin", "", "") === "switch-to-signup", "empty signup from sign in switches mode");
assert(decideSignUpIntent("signin", "  ", "") === "switch-to-signup", "blank signup from sign in switches mode");
assert(decideSignUpIntent("signup", "", "") === "need-fields", "empty signup while already signing up asks for fields");
assert(decideSignUpIntent("signin", "sai@example.com", "secret") === "create-account", "filled signup creates");
assert(decideSignUpIntent("signup", "sai@example.com", "secret") === "create-account", "filled signup in signup mode creates");
assert(decideSignInIntent("", "") === "need-fields", "empty sign in keeps the empty check");
assert(decideSignInIntent("sai@example.com", "secret") === "sign-in", "filled sign in signs in");
assert(canCreateSignUpAccount(false) === false, "unchecked Terms cannot create");
assert(canCreateSignUpAccount(true) === true, "checked Terms can create");
assert(LOGIN_TERMS_AGREE === "I agree to the Terms.", "agree copy lock");
assert(LOGIN_TERMS_AGREE.toLowerCase().includes("i agree to the terms"), "agree copy names Terms");
assert(!/privacy/i.test(LOGIN_TERMS_AGREE), "Sign up agree does not mention Privacy");
assert(LOGIN_SIGN_UP_API === "/api/signup", "Sign up create posts to /api/signup");
assert(LOGIN_TERMS_NEED.toLowerCase().includes("agree"), "need copy asks them to agree");
assert(LOGIN_TERMS_NEED.toLowerCase().includes("terms"), "need copy names Terms");
assert(LOGIN_TERMS_PATH === "/terms", "Terms link is /terms");
assert(LOGIN_PRIVACY_PATH === "/privacy", "Privacy link is /privacy");
assert(existsSync(new URL("../app/terms/page.tsx", import.meta.url)), "existing /terms page stays");
assert(existsSync(new URL("../app/privacy/page.tsx", import.meta.url)), "existing /privacy page stays");

assert(loginHeading("signin") === LOGIN_SIGN_IN_HEADING, "signin heading");
assert(loginHeading("signup") === LOGIN_SIGN_UP_HEADING, "signup heading");
assert(loginHelp("signup") === LOGIN_SIGN_UP_HELP, "signup helper");
assert(loginHelp("signin") === LOGIN_SIGN_IN_HELP, "signin helper");

assert(src.includes("decideSignUpIntent"), "page uses shared signup intent");
assert(src.includes("decideSignInIntent"), "page uses shared signin intent");
assert(src.includes("loginHeading"), "page uses shared heading");
assert(src.includes("loginHelp"), "page uses shared helper");
assert(src.includes("LOGIN_SIGN_UP_PROMPT"), "empty signup first tap asks, it does not reuse the dead error");
assert(src.includes('setMode("signup")') || src.includes("setMode('signup')"), "empty signup enters signup mode");
assert(src.includes("emailRef") && src.includes(".focus("), "empty signup focuses email");
assert(src.includes("LOGIN_SIGN_UP_API") || src.includes("/api/signup"), "filled signup posts to the server");
assert(!src.includes("supabase.auth.signUp"), "login page does not create an account in the browser");
assert(src.includes("goNext"), "session signup still follows next path");
assert(src.includes("LOGIN_CREATED_CONFIRM") || src.includes(LOGIN_CREATED_CONFIRM), "confirm copy stays");
assert(src.includes("handleForgot") && src.includes("LOGIN_FORGOT_LABEL"), "Forgot password stays");
assert(src.includes("handleResendConfirm") && src.includes("LOGIN_RESEND_LABEL"), "Resend confirmation stays");
assert(src.includes("value={email}") && src.includes("value={password}"), "email and password stay controlled");
assert(src.includes("setEmail") && src.includes("setPassword"), "inputs stay bound");
assert(src.includes("LOGIN_SIGN_IN_LABEL") && src.includes("LOGIN_SIGN_UP_LABEL"), "both buttons stay");
assert(/type=["']button["'][\s\S]*handleSignUp|onClick=\{handleSignUp\}/.test(src), "Sign up is its own button");
assert(src.includes("onClick={handleSignIn}") || src.includes('type="submit"'), "Sign in stays a real control");
assert(!/app\/signup/.test(src), "same /login page");
assert(src.includes("loginPageModeFromSearch"), "login honors ?mode=signup");
assert(src.includes("LOGIN_AGE_NOTE"), "age note is shared copy");
assert(src.includes("LOGIN_FORGOT_SENT"), "forgot success is shared copy");
assert(src.includes("LOGIN_RESEND_SENT"), "resend success is shared copy");
assert(!/Supabase/.test(src), "login page has no public Supabase talk");
assert(!/allow-list|this page does not turn it on/i.test(src), "login page drops leftover internals");
assert(!/[—–]/.test(src), "login page has no em or en dash");

const config = read("next.config.ts");
assert(config.includes("/signup"), "signup redirect exists");
assert(config.includes(LOGIN_SIGN_UP_PATH), "signup redirect lands on login Sign up");
assert(!existsSync(new URL("../app/signup/route.ts", import.meta.url)), "do not invent a signup route handler");

const signUpFn = src.slice(src.indexOf("function handleSignUp"), src.indexOf("function handleSignIn"));
assert(signUpFn.includes('"switch-to-signup"'), "empty tap from sign in is a mode switch");
assert(signUpFn.includes("LOGIN_SIGN_UP_PROMPT"), "mode switch asks them to enter email and password");
assert(signUpFn.includes('intent === "create-account"') || signUpFn.includes('"create-account"'), "filled signup creates");
assert(
  /switch-to-signup[\s\S]*LOGIN_SIGN_UP_PROMPT/.test(signUpFn),
  "the switch branch uses the signup prompt, not the sign in error"
);
assert(
  !/switch-to-signup[\s\S]{0,180}LOGIN_EMPTY_FIELDS/.test(signUpFn),
  "mode switch must not show the sign in empty error"
);
assert(
  signUpFn.indexOf('"switch-to-signup"') < signUpFn.indexOf("canCreateSignUpAccount"),
  "empty Sign up still opens Sign up before the Terms lock"
);
assert(signUpFn.includes("canCreateSignUpAccount"), "handleSignUp checks Terms before create");
assert(signUpFn.includes("LOGIN_TERMS_NEED"), "handleSignUp tells them to agree");
const createGuard = signUpFn.slice(signUpFn.indexOf("create-account"), signUpFn.indexOf("LOGIN_SIGN_UP_API"));
assert(createGuard.includes("canCreateSignUpAccount"), "create path checks agree");
assert(createGuard.includes("return"), "handleSignUp returns without agree");
assert(!createGuard.includes("LOGIN_SIGN_UP_API"), "no server create without agree");
assert(signUpFn.includes('agreed: true'), "checked Sign up sends agreed");

const signInFn = src.slice(src.indexOf("function handleSignIn"), src.indexOf("function handleForgot"));
assert(!signInFn.includes("canCreateSignUpAccount"), "sign in does not require Terms");
assert(!signInFn.includes("agreedTerms"), "sign in does not read the Terms checkbox");

const resetFn = src.slice(src.indexOf("function handleUpdatePassword"), src.indexOf("const fieldStyle"));
assert(!resetFn.includes("canCreateSignUpAccount"), "password reset does not require Terms");
assert(!resetFn.includes("agreedTerms"), "password reset does not read the Terms checkbox");

assert(src.includes('mode === "signup"'), "Terms checkbox is Sign up only");
assert(src.includes('type="checkbox"'), "Sign up has a required checkbox");
assert(src.includes("required"), "Terms checkbox is required");
assert(src.includes("agreedTerms"), "checkbox state is tracked");
assert(src.includes("LOGIN_TERMS_PATH") || src.includes('href="/terms"'), "Terms links to /terms");
assert(src.includes("href={LOGIN_TERMS_PATH}") || src.includes('href="/terms"'), "Terms href is /terms");
assert(!src.includes("LOGIN_PRIVACY_PATH"), "Sign up checkbox does not link Privacy");
assert(!/and Privacy/.test(src), "Sign up checkbox is not I agree to the Terms and Privacy");
assert(/I agree to the/.test(src), "agree copy is on the page");
assert(src.includes("Terms"), "checkbox names Terms");
assert(
  /disabled=\{busy \|\| \(mode === "signup" && !agreedTerms\)\}/.test(src),
  "Sign up is disabled without agree"
);
assert(
  /mode === "signup" \? \([\s\S]*type=["']checkbox["']/.test(src),
  "the required checkbox is on Sign up only"
);
const resetJsx = src.slice(src.indexOf('{mode === "reset"'), src.indexOf(") : ("));
assert(resetJsx.includes("Save password"), "reset block is the password form");
assert(!/type=["']checkbox["']/.test(resetJsx), "reset does not ask Terms");

assert(existsSync(new URL("../app/api/signup/route.ts", import.meta.url)), "server signup route exists");
const signupApiSrc = read("app/api/signup/route.ts");
assert(signupApiSrc.includes("canCreateSignUpAccount"), "server signup checks agree");
assert(signupApiSrc.includes("LOGIN_TERMS_NEED"), "server signup returns agree error");
assert(signupApiSrc.includes("status: 400"), "server signup reject is 400");
const signupGuard = signupApiSrc.slice(0, signupApiSrc.indexOf("auth.signUp"));
assert(signupGuard.includes("canCreateSignUpAccount"), "agree is checked before create");
assert(signupGuard.includes("return"), "server returns without agree");
assert(!signupGuard.includes("auth.signUp") || signupGuard.indexOf("canCreateSignUpAccount") < signupApiSrc.indexOf("auth.signUp"), "no account without agree");

assert(helpers.includes("supabase") === false, "helpers stay intent only, auth stays on the login page");
assert(layout.includes("Bandham AI"), "layout names Bandham AI");
assert(chrome.includes(LOGIN_TAGLINE), "chrome tagline stays Find your vibe match?");
assert(!/\$9\.99/.test(src), "login page does not name a messaging price");
assert(!/raised_in|public\.feedback/.test(src), "do not invent raised_in or public.feedback");

console.log("login signup mode ok", {
  product: LOGIN_PRODUCT,
  emptySignUp: decideSignUpIntent("signin", "", ""),
  filledSignUp: decideSignUpIntent("signin", "a@b.c", "x"),
  emptySignIn: decideSignInIntent("", ""),
  termsUnchecked: canCreateSignUpAccount(false),
  termsChecked: canCreateSignUpAccount(true),
});
