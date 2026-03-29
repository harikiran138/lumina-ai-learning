const PHONE_REGEX = /^\+?[0-9()\-\s]{8,20}$/;

export function validateRequiredName(value: string, label = "Name"): string | null {
  const normalized = value.trim();
  if (!normalized) {
    return `${label} is required`;
  }
  if (normalized.length < 2) {
    return `${label} must be at least 2 characters`;
  }
  return null;
}

export function validateOptionalPhone(value: string, label = "Phone number"): string | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  if (!PHONE_REGEX.test(normalized)) {
    return `${label} is invalid`;
  }
  return null;
}

export function validateOptionalEmail(value: string, label = "Email"): string | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const result = normalized.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  if (!result) {
    return `${label} is invalid`;
  }
  return null;
}
