/**
 * NEXVORA CREDENTIAL ACCESS — FAIL CLOSED
 *
 * Every secret used by this codebase must come from the environment. There are no
 * literal fallbacks, because a fallback secret is a secret committed to git.
 *
 * The rule this module enforces: if a credential is missing, the calling feature
 * fails loudly and refuses to run. It never proceeds with a placeholder, and it
 * never silently sends an unauthenticated or wrongly-authenticated request to a
 * broker. A broker call that fails on a missing key is a bug report; a broker
 * call that succeeds with the wrong key is a financial incident.
 */

export class MissingCredentialError extends Error {
  public readonly variableName: string;

  constructor(variableName: string, purpose: string) {
    super(
      `Missing required credential: ${variableName}. ` +
        `It is needed for ${purpose}. ` +
        `Set it in your local .env (see .env.example) — this project deliberately has no fallback value.`
    );
    this.name = "MissingCredentialError";
    this.variableName = variableName;
  }
}

/**
 * Read a required credential. Throws MissingCredentialError when unset or blank.
 * Use this on any path where proceeding without the real value would be wrong.
 */
export function requireCredential(variableName: string, purpose: string): string {
  const raw = process.env[variableName];
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) {
    throw new MissingCredentialError(variableName, purpose);
  }
  return value;
}

/**
 * Read an optional credential. Returns null when unset, so callers can degrade to
 * an explicit "feature unavailable" state rather than inventing a result.
 */
export function optionalCredential(variableName: string): string | null {
  const raw = process.env[variableName];
  const value = typeof raw === "string" ? raw.trim() : "";
  return value || null;
}

/**
 * True when a credential is present. For gating a feature before attempting it.
 */
export function hasCredential(variableName: string): boolean {
  return optionalCredential(variableName) !== null;
}

/**
 * Redact a secret for logging. Never log a raw credential — not even a prefix on
 * a short key, since Angel One API keys are only 8 characters and a 4-character
 * prefix would leak half of one.
 */
export function redactCredential(value: string | null | undefined): string {
  if (!value) return "<unset>";
  return `<set:${value.length} chars>`;
}
