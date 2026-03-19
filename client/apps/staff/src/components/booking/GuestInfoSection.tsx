/**
 * Guest Information Section
 * Manual guest info entry with option to search for existing guests
 * Uses react-hook-form context
 */

import { useFormContext } from "react-hook-form";
import { Label } from "@workspace/ui/components/label";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { Field } from "@workspace/ui/components/field";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { BookingFormState } from "../../pages/dashboard/booking/new/types";

interface GuestInfoSectionProps {
  onOpenSearch?: () => void;
  isExistingGuest?: boolean;
}

export function GuestInfoSection({
  onOpenSearch,
  isExistingGuest = false,
}: GuestInfoSectionProps) {
  const { t } = useTranslation();
  const { register, formState: { errors } } = useFormContext<BookingFormState>();

  return (
    <div className="space-y-4">
      {/* Header with Search Button */}
      <div className="flex items-center justify-between">
        <Label className="label-caps">{t("booking.guest.title")}</Label>
        {onOpenSearch && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenSearch}
            className="label-caps h-8"
          >
            <Search className="h-3.5 w-3.5 mr-1.5" />
            {t("booking.searchGuests.searchButton")}
          </Button>
        )}
      </div>

      {isExistingGuest && (
        <div className="px-3 py-2 bg-muted border border-border text-xs">
          <span className="label-caps text-muted-foreground">
            Using existing guest
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name */}
        <Field error={errors.first_name?.message}>
          <Label htmlFor="first_name" className="label-caps">
            {t("booking.guest.firstName")}
          </Label>
          <Input
            id="first_name"
            {...register("first_name", {
              required: t("booking.validation.firstNameRequired"),
            })}
            placeholder={t("booking.guest.firstNamePlaceholder")}
            disabled={isExistingGuest}
          />
        </Field>

        {/* Last Name */}
        <Field error={errors.last_name?.message}>
          <Label htmlFor="last_name" className="label-caps">
            {t("booking.guest.lastName")}
          </Label>
          <Input
            id="last_name"
            {...register("last_name", {
              required: t("booking.validation.lastNameRequired"),
            })}
            placeholder={t("booking.guest.lastNamePlaceholder")}
            disabled={isExistingGuest}
          />
        </Field>
      </div>

      {/* Email */}
      <Field error={errors.email?.message}>
        <Label htmlFor="email" className="label-caps">
          {t("booking.guest.email")}
        </Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder={t("booking.guest.emailPlaceholder")}
          disabled={isExistingGuest}
        />
      </Field>

      {/* Phone */}
      <Field error={errors.phone?.message}>
        <Label htmlFor="phone" className="label-caps">
          {t("booking.guest.phone")}
        </Label>
        <Input
          id="phone"
          type="tel"
          {...register("phone", {
            required: t("booking.validation.phoneRequired"),
          })}
          placeholder={t("booking.guest.phonePlaceholder")}
          className="font-mono"
          disabled={isExistingGuest}
        />
      </Field>
    </div>
  );
}
