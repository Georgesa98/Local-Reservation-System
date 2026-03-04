const en = {
  common: {
    or: "Or",
    cancel: "Cancel",
    current: "current",
  },

  login: {
    title: "Login",
    subtitle: "Enter your phone number below to login to your account",
    phoneLabel: "Phone Number",
    passwordLabel: "Password",
    forgotPassword: "Forgot Password",
    submit: "Sign In",
    orContinueWith: "Or continue with",
    noAccount: "Don't have an account?",
    signUp: "Request Access",
  },

  signup: {
    title: "Create your account",
    subtitle: "Fill in the form below to create your account",
    nameLabel: "Full Name",
    namePlaceholder: "John Doe",
    phoneLabel: "Phone Number",
    phoneDescription: "We'll use this to contact you. We will not share your phone number with anyone else.",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordDescription: "Must be at least 8 characters long.",
    confirmPasswordLabel: "Confirm Password",
    submit: "Create Account",
    orContinueWith: "Or continue with",
    hasAccount: "Already have an account?",
    signIn: "Sign in",
  },

  otp: {
    title: "Verify Identity",
    sentTo: "Enter the 6-digit code sent to",
    channel: {
      whatsapp: {
        title: "Check your WhatsApp",
        description: "We sent a 6-digit verification code to your WhatsApp number.",
      },
      email: {
        title: "Check your email",
        description: "We sent a 6-digit verification code to your email address.",
      },
      telegram: {
        title: "Check your Telegram",
        description: "We sent a 6-digit verification code to your Telegram account.",
      },
    },
    enterBelow: "Enter it below to continue.",
    codeLabel: "Verification Code",
    expires: "The code expires in 5 minutes.",
    submit: "Verify",
    didntReceive: "Didn't receive a code?",
    resend: "Resend Code",
    tryDifferent: "Try a different method",
    or: "or",
    goBack: "Back to Login",
  },

  otpDialog: {
    title: "Choose delivery method",
    description: "Select how you want to receive your verification code.",
    whatsapp: {
      label: "WhatsApp",
      description: "Send code to your WhatsApp number",
    },
    email: {
      label: "Email",
      description: "Send code to your email address",
      unavailable: "No email on file",
    },
    telegram: {
      label: "Telegram",
      description: "Send code to your Telegram account",
      unlinked: "Link your Telegram account first",
    },
    cancel: "Cancel",
  },

  toast: {
    sending: "Sending code…",
    codeSent: "Code sent!",
    resendFailed: "Failed to resend code. Please try again.",
    sendFailed: "Failed to send code via the selected method.",
    verified: "Phone number verified successfully.",
    loginSuccess: "Logged in successfully.",
    loginFailed: "Login failed. Check your credentials.",
    signupSuccess: "Account created! Please verify your phone.",
    signupFailed: "Signup failed. Please try again.",
    resetLinkSent: "Reset link sent! Check your email.",
    resetLinkFailed: "Failed to send reset link. Please try again.",
  },

  phoneInput: {
    searchPlaceholder: "Search country...",
    noResults: "No countries found",
  },

  validation: {
    nameMin: "Full name must be at least 2 characters",
    phoneRequired: "Phone number is required",
    phoneInvalid: "Enter a valid phone number",
    emailRequired: "Email is required",
    emailInvalid: "Enter a valid email address",
    passwordMin: "Password must be at least 8 characters",
    confirmPasswordRequired: "Please confirm your password",
    passwordsMismatch: "Passwords do not match",
    otpLength: "Code must be exactly 6 digits",
    otpDigits: "Code must contain only digits",
    otpIncorrect: "Incorrect code. Please try again.",
    otpFailed: "Verification failed. Please try again.",
    passwordRequired: "Password is required",
  },

  forgotPassword: {
    title: "Reset Password",
    emailLabel: "Email",
    emailPlaceholder: "you@company.com",
    submit: "Send Reset Link",
    backToLogin: "Back to Login",
  },

  nav: {
    dashboard: "Dashboard",
    rooms: "Rooms",
    bookings: "Bookings",
    finance: "Finance",
    system: "System",
    logout: "Logout",
  },
} as const

export default en
export type Translation = typeof en
