import { existsSync, readFileSync } from "node:fs";
import {
  LOGIN_CREATED_CONFIRM,
  LOGIN_CREATED_SESSION,
  LOGIN_EMPTY_FIELDS,
  LOGIN_FORGOT_LABEL,
  LOGIN_PRODUCT,
  LOGIN_RESEND_LABEL,
  LOGIN_SIGN_IN_HEADING,
  LOGIN_SIGN_IN_HELP,
  LOGIN_SIGN_IN_LABEL,
  LOGIN_SIGN_UP_HEADING,
  LOGIN_SIGN_UP_HELP,
  LOGIN_SIGN_UP_LABEL,
  LOGIN_SIGN_UP_PROMPT,
  LOGIN_TAGLINE,
  decideSignInIntent,
  decideSignUpIntent,
  hasLoginCredentials,
  loginHeading,
  loginHelp,
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
assert(src.includes("supabase.auth.signUp"), "filled signup uses existing supabase.auth.signUp");
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
});
