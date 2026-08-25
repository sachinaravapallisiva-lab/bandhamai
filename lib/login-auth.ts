/** Shared /login copy and Sign up vs Sign in intent. Same page, two buttons. */

export type LoginPageMode = "signin" | "signup" | "reset";
export type LoginAuthMode = "signin" | "signup";
export type SignUpIntent = "switch-to-signup" | "need-fields" | "create-account";
export type SignInIntent = "need-fields" | "sign-in";

export const LOGIN_PRODUCT = "Bandham AI";
export const LOGIN_TAGLINE = "Find your vibe match?";

export const LOGIN_SIGN_IN_HEADING = "Sign in";
export const LOGIN_SIGN_UP_HEADING = "Sign up";
export const LOGIN_RESET_HEADING = "New password";

export const LOGIN_SIGN_IN_HELP = "Use the same email and password to create a profile.";
export const LOGIN_SIGN_UP_HELP = "Create a Bandham AI account with your email and password.";
export const LOGIN_RESET_HELP = "This form is for the reset link from your email.";

export const LOGIN_EMPTY_FIELDS = "Enter an email and password.";
export const LOGIN_SIGN_UP_PROMPT = "Enter your email and password, then tap Sign up.";
export const LOGIN_CREATING = "Creating account...";
export const LOGIN_CREATED_SESSION = "Account created and signed in.";
export const LOGIN_CREATED_CONFIRM =
  "Account created. Check your email if confirmation is required, then sign in.";
export const LOGIN_SIGN_UP_UNREACHABLE = "Could not reach sign up. Try again.";

export const LOGIN_FORGOT_LABEL = "Forgot password";
export const LOGIN_RESEND_LABEL = "Resend confirmation";
export const LOGIN_SIGN_IN_LABEL = "Sign in";
export const LOGIN_SIGN_UP_LABEL = "Sign up";

export const LOGIN_AGE_NOTE =
  "Bandham AI is for people 18 and over. By signing in or signing up, you confirm you meet that age.";
export const LOGIN_FORGOT_SENT = "If that email has an account, a reset link is on its way.";
export const LOGIN_RESEND_SENT =
  "If that email needs confirmation, another email was sent. If you already signed in, you do not need this.";
export const LOGIN_SIGN_UP_PATH = "/login?mode=signup";

export function loginPageModeFromSearch(raw: string | null | undefined): LoginPageMode {
  if (raw === "reset") return "reset";
  if (raw === "signup") return "signup";
  return "signin";
}

export function hasLoginCredentials(email: string, password: string) {
  return Boolean(email.trim() && password);
}

export function loginAuthMode(mode: LoginPageMode): LoginAuthMode {
  return mode === "signup" ? "signup" : "signin";
}

export function loginHeading(mode: LoginPageMode) {
  if (mode === "reset") return LOGIN_RESET_HEADING;
  if (mode === "signup") return LOGIN_SIGN_UP_HEADING;
  return LOGIN_SIGN_IN_HEADING;
}

export function loginHelp(mode: LoginPageMode) {
  if (mode === "reset") return LOGIN_RESET_HELP;
  if (mode === "signup") return LOGIN_SIGN_UP_HELP;
  return LOGIN_SIGN_IN_HELP;
}

/** Empty Sign up from Sign in switches mode. It is not a failed Sign in. */
export function decideSignUpIntent(mode: LoginAuthMode, email: string, password: string): SignUpIntent {
  if (hasLoginCredentials(email, password)) return "create-account";
  if (mode === "signup") return "need-fields";
  return "switch-to-signup";
}

export function decideSignInIntent(email: string, password: string): SignInIntent {
  return hasLoginCredentials(email, password) ? "sign-in" : "need-fields";
}

export function loginUserCopy() {
  return [
    LOGIN_PRODUCT,
    LOGIN_TAGLINE,
    LOGIN_SIGN_IN_HEADING,
    LOGIN_SIGN_UP_HEADING,
    LOGIN_RESET_HEADING,
    LOGIN_SIGN_IN_HELP,
    LOGIN_SIGN_UP_HELP,
    LOGIN_RESET_HELP,
    LOGIN_EMPTY_FIELDS,
    LOGIN_SIGN_UP_PROMPT,
    LOGIN_CREATING,
    LOGIN_CREATED_SESSION,
    LOGIN_CREATED_CONFIRM,
    LOGIN_SIGN_UP_UNREACHABLE,
    LOGIN_FORGOT_LABEL,
    LOGIN_RESEND_LABEL,
    LOGIN_SIGN_IN_LABEL,
    LOGIN_SIGN_UP_LABEL,
    LOGIN_AGE_NOTE,
    LOGIN_FORGOT_SENT,
    LOGIN_RESEND_SENT,
  ];
}
