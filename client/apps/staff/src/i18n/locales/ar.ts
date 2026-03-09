import type { Translation } from "./en"

const ar: Translation = {
  common: {
    or: "أو",
    cancel: "إلغاء",
    current: "الحالي",
    back: "رجوع",
    comingSoon: "قريباً",
  },

  login: {
    title: "تسجيل الدخول",
    subtitle: "أدخل رقم هاتفك للمتابعة",
    phoneLabel: "رقم الهاتف",
    passwordLabel: "كلمة المرور",
    forgotPassword: "نسيت كلمة المرور",
    submit: "تسجيل الدخول",
    orContinueWith: "أو تابع بـ",
    noAccount: "ليس لديك حساب؟",
    signUp: "طلب وصول",
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
    title: "التحقق من الهوية",
    sentTo: "أدخل الرمز المكوّن من 6 أرقام المرسل إلى",
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
    goBack: "العودة إلى تسجيل الدخول",
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
    loginSuccess: "تم تسجيل الدخول بنجاح.",
    loginFailed: "فشل تسجيل الدخول. تحقق من بياناتك.",
    signupSuccess: "تم إنشاء الحساب! يرجى التحقق من هاتفك.",
    signupFailed: "فشل إنشاء الحساب. حاول مرة أخرى.",
    resetLinkSent: "تم إرسال رابط إعادة التعيين! تحقق من بريدك.",
    resetLinkFailed: "فشل إرسال الرابط. حاول مرة أخرى.",
  },

  phoneInput: {
    searchPlaceholder: "ابحث عن دولة...",
    noResults: "لا توجد نتائج",
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

  forgotPassword: {
    title: "إعادة تعيين كلمة المرور",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "you@company.com",
    submit: "إرسال رابط الإعادة",
    backToLogin: "العودة إلى تسجيل الدخول",
  },

  nav: {
    dashboard: "لوحة التحكم",
    rooms: "الغرف",
    bookings: "الحجوزات",
    finance: "المالية",
    system: "النظام",
    logout: "تسجيل الخروج",
  },

  rooms: {
    title: "المخزون",
    addRoom: "إضافة غرفة",
    searchPlaceholder: "ابحث عن عقار...",
    showInactive: "عرض غير النشطة",
    gridComingSoon: "عرض الشبكة قريباً",
    noRooms: "لا توجد غرف",
    showing: "عرض {{start}}–{{end}} من {{total}} غرفة",
    prev: "السابق",
    next: "التالي",
    loading: "جارٍ التحميل…",
    errorLoading: "فشل تحميل الغرف. حاول مرة أخرى.",
    noRoomsFound: "لا توجد غرف",
    toast: {
      deleted: "تم حذف الغرفة",
      deleteFailed: "فشل حذف الغرفة",
    },
    columns: {
      property: "العقار",
      capacity: "السعة",
      rate: "السعر (الليلة)",
      status: "الحالة",
      actions: "الإجراءات",
    },
    actions: {
      edit: "تعديل الغرفة",
      delete: "حذف الغرفة",
    },
    deleteDialog: {
      title: "حذف الغرفة",
      description: "هل أنت متأكد أنك تريد حذف",
      cannotUndo: "لا يمكن التراجع عن هذا الإجراء.",
      confirm: "حذف",
      cancel: "إلغاء",
    },
  },

  room: {
    breadcrumb: {
      inventory: "المخزون",
      rooms: "الغرف",
      room: "غرفة #{{number}}",
    },
    badge: {
      live: "نشط",
      inactive: "غير نشط",
    },
    lastSync: "آخر مزامنة",
    saveChanges: "حفظ التغييرات",
    saving: "جارٍ الحفظ…",
    loading: "جارٍ التحميل…",
    errorLoading: "فشل تحميل الغرفة. حاول مرة أخرى.",
    mainImageAlt: "صورة الغرفة",
    addImage: "إضافة صورة",
    manageAll: "إدارة الكل",
    editRules: "تعديل القواعد",
    chars: "حرف",
    tabs: {
      overview: "نظرة عامة",
      images: "الصور",
      pricing: "التسعير",
      availability: "التوفر",
      reviews: "التقييمات",
    },
    section: {
      generalInfo: "المعلومات العامة",
      occupancyRate: "الإشغال والسعر الأساسي",
      description: "الوصف",
      amenities: "المرافق",
      mainImage: "الصورة الرئيسية",
      activeRules: "القواعد النشطة",
    },
    field: {
      internalTitle: "العنوان الداخلي",
      publicListingName: "اسم القائمة العامة",
      propertyType: "نوع العقار",
      floorArea: "المساحة (م²)",
      maxGuests: "الحد الأقصى للضيوف",
      bedrooms: "غرف النوم",
      baseNightlyRate: "السعر الأساسي للليلة",
      marketingCopy: "النص التسويقي",
    },
    amenities: {
      add: "إضافة",
      allAdded: "تمت إضافة جميع المرافق",
    },
    rules: {
      rule: "القاعدة",
      adj: "التعديل",
      none: "لا توجد قواعد نشطة",
      total: "إجمالي {{count}} قواعد نشطة",
    },
    toast: {
      saved: "تم حفظ الغرفة",
      saveFailed: "فشل حفظ الغرفة",
    },
  },
}

export default ar
