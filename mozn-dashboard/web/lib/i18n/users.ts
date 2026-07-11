import type { Entry } from "../i18n";

// Filled by the i18n pass. Keys are namespaced (e.g. "users.title").
// Shared status/severity/region/signal/role/common.* keys live in chrome.ts —
// reuse those instead of redefining here.
export const users: Record<string, Entry> = {
  // Toolbar
  "users.searchPlaceholder": { en: "Search users…", ar: "ابحث في المستخدمين…" },
  "users.searchAria": { en: "Search users", ar: "البحث في المستخدمين" },
  "users.addUser": { en: "Add user", ar: "إضافة مستخدم" },

  // Table column headers
  "users.colUser": { en: "User", ar: "المستخدم" },
  "users.colRole": { en: "Role", ar: "الدور" },
  "users.colRegions": { en: "Assigned regions", ar: "المناطق المعيّنة" },
  "users.colLastActive": { en: "Last active", ar: "آخر نشاط" },
  "users.colStatus": { en: "Status", ar: "الحالة" },

  // Status
  "users.statusActive": { en: "Active", ar: "نشط" },
  "users.statusInactive": { en: "Inactive", ar: "غير نشط" },

  // Row actions
  "users.actionsFor": { en: "Actions for {name}", ar: "إجراءات لـ {name}" },
  "users.editUser": { en: "Edit user", ar: "تعديل المستخدم" },
  "users.deactivate": { en: "Deactivate", ar: "إلغاء التنشيط" },
  "users.activate": { en: "Activate", ar: "تنشيط" },
  "users.removeUser": { en: "Remove user", ar: "إزالة المستخدم" },

  // Empty state — filtered (no match) vs. genuinely empty (no data yet).
  "users.empty": { en: "No users match your filters.", ar: "لا يوجد مستخدمون يطابقون عوامل التصفية." },
  "users.emptyTitle": { en: "No matching users", ar: "لا يوجد مستخدمون مطابقون" },
  "users.noDataTitle": { en: "No users yet", ar: "لا يوجد مستخدمون بعد" },
  "users.noData": {
    en: "Add a user to grant access to the dashboard.",
    ar: "أضف مستخدمًا لمنح صلاحية الوصول إلى لوحة التحكم.",
  },

  // Dialog
  "users.dialogEditTitle": { en: "Edit user", ar: "تعديل المستخدم" },
  "users.dialogAddTitle": { en: "Add user", ar: "إضافة مستخدم" },
  "users.dialogEditDesc": {
    en: "Update this account's details and access.",
    ar: "حدّث تفاصيل هذا الحساب وصلاحياته.",
  },
  "users.dialogAddDesc": {
    en: "Invite a new account and assign its role and regions.",
    ar: "ادعُ حساباً جديداً وعيّن دوره ومناطقه.",
  },

  // Field labels
  "users.fieldName": { en: "Full name", ar: "الاسم الكامل" },
  "users.fieldEmail": { en: "Email", ar: "البريد الإلكتروني" },
  "users.fieldPassword": { en: "Password", ar: "كلمة المرور" },
  "users.passwordKeepHint": {
    en: "(leave blank to keep current)",
    ar: "(اتركها فارغة للإبقاء على الحالية)",
  },
  "users.fieldRole": { en: "Role", ar: "الدور" },
  "users.fieldRegions": { en: "Assigned regions", ar: "المناطق المعيّنة" },
  "users.fieldPhone": { en: "Phone", ar: "الهاتف" },
  "users.fieldOrg": { en: "Organization", ar: "الجهة" },
  "users.optional": { en: "(optional)", ar: "(اختياري)" },
  "users.phonePlaceholder": { en: "+218 91 234 5678", ar: "+218 91 234 5678" },
  "users.orgPlaceholder": {
    en: "e.g. Ministry of Local Government",
    ar: "مثال: وزارة الحكم المحلي",
  },

  // Helper line
  "users.formHelp": {
    en: "Role sets account permissions. Leave regions blank to grant access to all regions.",
    ar: "يحدد الدور صلاحيات الحساب. اترك المناطق فارغة لمنح الوصول إلى جميع المناطق.",
  },

  // Input placeholders
  "users.namePlaceholder": { en: "Full name", ar: "الاسم الكامل" },
  "users.emailPlaceholder": { en: "name@example.org", ar: "name@example.org" },
  "users.passwordPlaceholder": {
    en: "At least {n} characters",
    ar: "{n} أحرف على الأقل",
  },
  "users.regionsPlaceholder": {
    en: "e.g. Cyrenaica (East)",
    ar: "مثال: برقة (الشرق)",
  },

  // Password visibility toggle
  "users.showPassword": { en: "Show password", ar: "إظهار كلمة المرور" },
  "users.hidePassword": { en: "Hide password", ar: "إخفاء كلمة المرور" },

  // Footer
  "users.submitAdd": { en: "Add user", ar: "إضافة مستخدم" },

  // Toasts
  "users.toastNameEmailRequired": {
    en: "Name and email are required",
    ar: "الاسم والبريد الإلكتروني مطلوبان",
  },
  "users.toastPasswordMin": {
    en: "Password must be at least {n} characters",
    ar: "يجب أن تتكون كلمة المرور من {n} أحرف على الأقل",
  },
  "users.toastSaved": {
    en: "Saved changes to {name}",
    ar: "تم حفظ التغييرات على {name}",
  },
  "users.toastAdded": { en: "Added {name}", ar: "تمت إضافة {name}" },
  "users.toastActivated": { en: "{name} activated", ar: "تم تنشيط {name}" },
  "users.toastDeactivated": { en: "{name} deactivated", ar: "تم إلغاء تنشيط {name}" },
  "users.toastRemoved": { en: "Removed {name}", ar: "تمت إزالة {name}" },
  "users.saveFailed": { en: "Action failed", ar: "فشل الإجراء" },
  "users.bulkActivated": { en: "Activated {count} user(s)", ar: "تم تفعيل {count} مستخدم" },
  "users.bulkDeactivated": { en: "Deactivated {count} user(s)", ar: "تم تعطيل {count} مستخدم" },
  "users.bulkDeleted": { en: "Removed {count} user(s)", ar: "تمت إزالة {count} مستخدم" },
  "users.bulkFailed": { en: "Some actions failed", ar: "فشلت بعض الإجراءات" },
  "users.bulkDeleteTitle": { en: "Remove selected users?", ar: "إزالة المستخدمين المحددين؟" },
  "users.bulkDeleteDesc": {
    en: "This permanently removes {count} user account(s). This cannot be undone.",
    ar: "سيؤدي هذا إلى إزالة {count} حساب مستخدم نهائياً. لا يمكن التراجع.",
  },
  "users.bulkDeleteConfirm": { en: "Remove users", ar: "إزالة المستخدمين" },
  "users.noRegions": { en: "No regions available", ar: "لا توجد مناطق متاحة" },
  "users.editIdentityHint": {
    en: "Name, email, and password can't be changed here — update role, regions, and contact details below.",
    ar: "لا يمكن تغيير الاسم والبريد وكلمة المرور هنا — عدّل الدور والمناطق وبيانات الاتصال أدناه.",
  },

  // Users & Access tabs
  "users.tab.list": { en: "Users", ar: "المستخدمون" },
  "users.tab.roles": { en: "Roles & permissions", ar: "الأدوار والصلاحيات" },

  // Role permissions matrix (A4.2)
  // Role column headers in the permission matrix, keyed on the raw backend role
  // name (falls back to the humanized label if a new role appears).
  "roleName.admin": { en: "Super Admin", ar: "مدير عام" },
  "roleName.operator": { en: "Operator", ar: "مشغّل" },
  "roleName.gov_editor": { en: "Gov Editor", ar: "محرر حكومي" },
  "roleName.gov_viewer": { en: "Gov Viewer", ar: "مشاهد حكومي" },
  "roleName.viewer": { en: "Viewer", ar: "مشاهد" },
  // Permission-matrix section headers, keyed on the group (name before the dot).
  "permGroup.stations": { en: "Stations", ar: "المحطات" },
  "permGroup.alerts": { en: "Alerts", ar: "التنبيهات" },
  "permGroup.thresholds": { en: "Thresholds", ar: "الحدود" },
  "permGroup.users": { en: "Users", ar: "المستخدمون" },
  "permGroup.roles": { en: "Roles", ar: "الأدوار" },
  "permGroup.settings": { en: "Settings", ar: "الإعدادات" },
  "permGroup.compound_rules": { en: "Compound Rules", ar: "القواعد المركّبة" },
  "permGroup.validation_rules": { en: "Validation Rules", ar: "قواعد التحقق" },
  "permGroup.templates": { en: "Templates", ar: "القوالب" },
  "permGroup.municipalities": { en: "Municipalities", ar: "البلديات" },
  "permGroup.regions": { en: "Regions", ar: "المناطق" },
  "permGroup.dashboard": { en: "Dashboard", ar: "لوحة المعلومات" },
  "permGroup.audit_log": { en: "Audit Log", ar: "سجل التدقيق" },
  "permGroup.gov": { en: "Government", ar: "الجهات الحكومية" },
  "permGroup.readings": { en: "Readings", ar: "القراءات" },
  "permGroup.forecasts": { en: "Forecasts", ar: "التنبؤات" },
  "permGroup.system": { en: "System", ar: "النظام" },
  // Permission-matrix row labels, keyed on the action (name after the dot).
  "permAction.create": { en: "Create", ar: "إنشاء" },
  "permAction.update": { en: "Update", ar: "تعديل" },
  "permAction.delete": { en: "Delete", ar: "حذف" },
  "permAction.view": { en: "View", ar: "عرض" },
  "permAction.manage": { en: "Manage", ar: "إدارة" },
  "permAction.confirm": { en: "Confirm", ar: "تأكيد" },
  "permAction.reject": { en: "Reject", ar: "رفض" },
  "permAction.dismiss": { en: "Dismiss", ar: "تجاهل" },
  "permAction.acknowledge": { en: "Acknowledge", ar: "إقرار" },
  "permAction.unacknowledge": { en: "Unacknowledge", ar: "إلغاء الإقرار" },
  "permAction.escalate": { en: "Escalate", ar: "تصعيد" },
  "permAction.modify": { en: "Modify", ar: "تعديل التنبيه" },
  "permAction.resolve": { en: "Resolve", ar: "إنهاء" },
  "permAction.reopen": { en: "Reopen", ar: "إعادة فتح" },
  // gov.* permissions render their action as the resource word.
  "permAction.dashboard": { en: "Dashboard", ar: "لوحة المعلومات" },
  "permAction.stations": { en: "Stations", ar: "المحطات" },
  "permAction.alerts": { en: "Alerts", ar: "التنبيهات" },
  "roles.title": { en: "Role permissions", ar: "صلاحيات الأدوار" },
  "roles.subtitle": {
    en: "Toggle what each role can do. Super Admin always keeps full access.",
    ar: "بدّل ما يمكن لكل دور فعله. يحتفظ مدير النظام دائمًا بكامل الصلاحيات.",
  },
  "roles.saved": { en: "Permissions saved", ar: "تم حفظ الصلاحيات" },
  "roles.saveFailed": { en: "Save failed", ar: "فشل الحفظ" },
  "roles.noRoles": {
    en: "No roles to show. You may not have permission to manage roles.",
    ar: "لا توجد أدوار لعرضها. قد لا تملك صلاحية إدارة الأدوار.",
  },
  "roles.col.permission": { en: "Permission", ar: "الصلاحية" },
  "roles.col.capability": { en: "Capability", ar: "الصلاحية" },
  "roles.cap.viewStations": { en: "View stations", ar: "عرض المحطات" },
  "roles.cap.manageStations": { en: "Manage stations", ar: "إدارة المحطات" },
  "roles.cap.configureThresholds": { en: "Configure thresholds", ar: "ضبط الحدود" },
  "roles.cap.manageAlerts": { en: "Manage alerts", ar: "إدارة التنبيهات" },
  "roles.cap.manageUsers": { en: "Manage users & access", ar: "إدارة المستخدمين والصلاحيات" },
  "roles.cap.viewInbox": { en: "View alert inbox", ar: "عرض صندوق التنبيهات" },
  "roles.cap.ackAlerts": { en: "Acknowledge alerts", ar: "الإقرار بالتنبيهات" },
  "roles.cap.viewHistory": { en: "View history & audit", ar: "عرض السجل والتدقيق" },
  "roles.cap.configureValidation": { en: "Configure validation rules", ar: "ضبط قواعد التحقق" },
  "roles.cap.exportData": { en: "Export data", ar: "تصدير البيانات" },

  // Sole-editor-for-region safeguard
  "users.soleEditor.title": { en: "Last editor for a region", ar: "آخر محرّر لمنطقة" },
  "users.soleEditor.desc": {
    en: "{name} is the only active editor for {regions}. Deactivating leaves no one able to manage those regions. Continue?",
    ar: "{name} هو المحرّر النشط الوحيد لـ {regions}. سيؤدي إلغاء التنشيط إلى عدم وجود من يدير تلك المناطق. هل تريد المتابعة؟",
  },
  "users.soleEditor.confirm": { en: "Deactivate anyway", ar: "إلغاء التنشيط على أي حال" },
};
