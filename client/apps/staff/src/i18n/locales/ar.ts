import type { Translation } from "./en"

const ar: Translation = {
  common: {
    or: "أو",
    cancel: "إلغاء",
    current: "الحالي",
  },

  login: {
    title: "تسجيل الدخول",
    subtitle: "أدخل رقم هاتفك للمتابعة",
    phoneLabel: "رقم الهاتف",
    passwordLabel: "كلمة المرور",
    forgotPassword: "نسيت كلمة المرور؟",
    submit: "تسجيل الدخول",
    orContinueWith: "أو تابع بـ",
    noAccount: "ليس لديك حساب؟",
    signUp: "إنشاء حساب",
  },

  signup: {
    title: "إنشاء حساب جديد",
    subtitle: "أكمل البيانات التالية لإنشاء حسابك",
    nameLabel: "الاسم الكامل",
    namePlaceholder: "محمد أحمد",
    phoneLabel: "رقم الهاتف",
    phoneDescription: "سنستخدم هذا الرقم للتواصل معك. لن نشاركه مع أي طرف آخر.",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "you@example.com",
    passwordLabel: "كلمة المرور",
    passwordDescription: "يجب أن تكون 8 أحرف على الأقل.",
    confirmPasswordLabel: "تأكيد كلمة المرور",
    submit: "إنشاء الحساب",
    orContinueWith: "أو تابع بـ",
    hasAccount: "لديك حساب بالفعل؟",
    signIn: "تسجيل الدخول",
  },

  otp: {
    channel: {
      whatsapp: {
        title: "تحقق من واتساب",
        description: "أرسلنا رمز تحقق مكوّن من 6 أرقام إلى رقم واتساب الخاص بك.",
      },
      email: {
        title: "تحقق من بريدك الإلكتروني",
        description: "أرسلنا رمز تحقق مكوّن من 6 أرقام إلى بريدك الإلكتروني.",
      },
      telegram: {
        title: "تحقق من تيليغرام",
        description: "أرسلنا رمز تحقق مكوّن من 6 أرقام إلى حساب تيليغرام الخاص بك.",
      },
    },
    enterBelow: "أدخله أدناه للمتابعة.",
    codeLabel: "رمز التحقق",
    expires: "ينتهي صلاحية الرمز خلال 5 دقائق.",
    submit: "تحقق",
    didntReceive: "لم تستلم الرمز؟",
    resend: "إعادة الإرسال",
    tryDifferent: "جرّب طريقة أخرى",
    or: "أو",
    goBack: "العودة",
  },

  otpDialog: {
    title: "اختر طريقة الاستلام",
    description: "حدد الطريقة التي تريد استلام رمز التحقق بها.",
    whatsapp: {
      label: "واتساب",
      description: "إرسال الرمز إلى رقم واتساب",
    },
    email: {
      label: "البريد الإلكتروني",
      description: "إرسال الرمز إلى بريدك الإلكتروني",
      unavailable: "لا يوجد بريد إلكتروني مسجّل",
    },
    telegram: {
      label: "تيليغرام",
      description: "إرسال الرمز إلى حساب تيليغرام",
      unlinked: "اربط حساب تيليغرام أولاً",
    },
    cancel: "إلغاء",
  },

  toast: {
    sending: "جارٍ الإرسال…",
    codeSent: "تم إرسال الرمز!",
    resendFailed: "فشل إعادة الإرسال. حاول مرة أخرى.",
    sendFailed: "فشل إرسال الرمز عبر الطريقة المحددة.",
    verified: "تم التحقق من رقم الهاتف بنجاح.",
  },

  validation: {
    nameMin: "يجب أن يكون الاسم الكامل حرفين على الأقل",
    phoneRequired: "رقم الهاتف مطلوب",
    phoneInvalid: "أدخل رقم هاتف صحيح",
    emailRequired: "البريد الإلكتروني مطلوب",
    emailInvalid: "أدخل بريداً إلكترونياً صحيحاً",
    passwordMin: "يجب أن تكون كلمة المرور 8 أحرف على الأقل",
    confirmPasswordRequired: "يرجى تأكيد كلمة المرور",
    passwordsMismatch: "كلمتا المرور غير متطابقتين",
    otpLength: "يجب أن يتكون الرمز من 6 أرقام بالضبط",
    otpDigits: "يجب أن يحتوي الرمز على أرقام فقط",
    otpIncorrect: "الرمز غير صحيح. حاول مرة أخرى.",
    otpFailed: "فشل التحقق. حاول مرة أخرى.",
    passwordRequired: "كلمة المرور مطلوبة",
  },
}

export default ar
