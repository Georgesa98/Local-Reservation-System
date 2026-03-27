/**
 * Utility functions for masking sensitive data
 */

/**
 * Mask phone number for display
 * Example: "+963123456789" → "+963*******789"
 */
export function maskPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber || phoneNumber.length < 7) {
    return phoneNumber;
  }

  // Keep country code (first 4 chars) and last 3 digits
  const countryCode = phoneNumber.substring(0, 4);
  const lastDigits = phoneNumber.substring(phoneNumber.length - 3);
  const maskedMiddle = "*".repeat(phoneNumber.length - 7);

  return `${countryCode}${maskedMiddle}${lastDigits}`;
}

/**
 * Mask email address for display
 * Example: "john.doe@example.com" → "j***@example.com"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) {
    return email;
  }

  const [localPart, domain] = email.split("@");

  if (!localPart || localPart.length <= 1) {
    return email;
  }

  // Keep first character and mask the rest
  const maskedLocal = localPart[0] + "***";

  return `${maskedLocal}@${domain}`;
}
