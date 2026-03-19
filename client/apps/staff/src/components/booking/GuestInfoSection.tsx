/**
 * Guest Information Section
 * Manual guest info entry (guest search to be implemented later when backend supports it)
 */

import { Label } from "@workspace/ui/components/label";
import { Input } from "@workspace/ui/components/input";
import { Field } from "@workspace/ui/components/field";
import { useTranslation } from "react-i18next";
import type { GuestFormData } from "../../pages/dashboard/booking/new/types";

interface GuestInfoSectionProps {
  value: GuestFormData;
  onChange: (guest: GuestFormData) => void;
  errors?: Partial<Record<keyof GuestFormData, string>>;
}

export function GuestInfoSection({
  value,
  onChange,
  errors = {},
}: GuestInfoSectionProps) {
  const { t } = useTranslation();

  const handleChange = (field: keyof GuestFormData, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="space-y-4">
      <Label className="label-caps">{t("booking.guest.title")}</Label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name */}
        <Field error={errors.first_name}>
          <Label htmlFor="first_name" className="label-caps">
            {t("booking.guest.firstName")}
          </Label>
          <Input
            id="first_name"
            value={value.first_name}
            onChange={(e) => handleChange("first_name", e.target.value)}
            placeholder={t("booking.guest.firstNamePlaceholder")}
          />
        </Field>

        {/* Last Name */}
        <Field error={errors.last_name}>
          <Label htmlFor="last_name" className="label-caps">
            {t("booking.guest.lastName")}
          </Label>
          <Input
            id="last_name"
            value={value.last_name}
            onChange={(e) => handleChange("last_name", e.target.value)}
            placeholder={t("booking.guest.lastNamePlaceholder")}
          />
        </Field>
      </div>

      {/* Email */}
      <Field error={errors.email}>
        <Label htmlFor="email" className="label-caps">
          {t("booking.guest.email")}
        </Label>
        <Input
          id="email"
          type="email"
          value={value.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder={t("booking.guest.emailPlaceholder")}
        />
      </Field>

      {/* Phone */}
      <Field error={errors.phone}>
        <Label htmlFor="phone" className="label-caps">
          {t("booking.guest.phone")}
        </Label>
        <Input
          id="phone"
          type="tel"
          value={value.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          placeholder={t("booking.guest.phonePlaceholder")}
          className="font-mono"
        />
      </Field>
    </div>
  );
}
