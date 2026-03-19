/**
 * Booking Type Selection Section
 * Neo-Swiss design: Radio cards for walk-in vs phone/remote booking
 * Uses react-hook-form context
 */

import { useFormContext, useController } from "react-hook-form";
import { Label } from "@workspace/ui/components/label";
import type { BookingType, BookingFormState } from "../../pages/dashboard/booking/new/types";
import { useTranslation } from "react-i18next";
import { User, Phone } from "lucide-react";

export function BookingTypeSection() {
  const { t } = useTranslation();
  const { field, fieldState } = useController<BookingFormState, "booking_type">({
    name: "booking_type",
  });
  
  const value = field.value;
  const error = fieldState.error?.message;

  const options: Array<{
    value: BookingType;
    label: string;
    description: string;
    icon: typeof User;
  }> = [
    {
      value: "walk-in",
      label: t("booking.type.walkIn.label"),
      description: t("booking.type.walkIn.description"),
      icon: User,
    },
    {
      value: "phone",
      label: t("booking.type.phone.label"),
      description: t("booking.type.phone.description"),
      icon: Phone,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label className="label-caps">{t("booking.type.title")}</Label>
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => field.onChange(option.value)}
              className={`
                relative flex flex-col items-start gap-3 p-6
                border-2 transition-colors
                hover:border-primary/50
                ${
                  isSelected
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-card border-border text-foreground"
                }
              `}
            >
              {/* Icon */}
              <div
                className={`
                  p-2 border
                  ${
                    isSelected
                      ? "border-primary-foreground bg-transparent"
                      : "border-border bg-transparent"
                  }
                `}
              >
                <Icon className="h-5 w-5" />
              </div>

              {/* Label and description */}
              <div className="text-left">
                <p className="font-medium uppercase tracking-wide text-sm">
                  {option.label}
                </p>
                <p
                  className={`mt-1 text-sm ${
                    isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                  }`}
                >
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
