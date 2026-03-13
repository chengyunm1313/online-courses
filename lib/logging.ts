type LoggableValue = string | number | boolean | null | undefined;

export function sanitizeLogContext(
  context: Record<string, LoggableValue>,
): Record<string, LoggableValue> {
  const sanitized: Record<string, LoggableValue> = {};

  for (const [key, value] of Object.entries(context)) {
    if (
      key.toLowerCase().includes("signature") ||
      key.toLowerCase().includes("checkmac") ||
      key.toLowerCase().includes("hashkey") ||
      key.toLowerCase().includes("hashiv") ||
      key.toLowerCase().includes("authcode")
    ) {
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}
