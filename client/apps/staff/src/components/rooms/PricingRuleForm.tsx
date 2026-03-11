import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import type { PricingRule, PricingRulePayload, RuleType } from "../../pages/dashboard/rooms/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface PricingRuleFormValues {
  rule_type: RuleType;
  price_modifier: string;
  is_percentage: boolean;
  start_date: string;
  end_date: string;
  min_nights: string;
  days_of_week: number[];
  priority: string;
  is_active: boolean;
}

interface PricingRuleFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: PricingRulePayload) => void;
  onDelete?: () => void;
  rule?: PricingRule | null;
  isSaving?: boolean;
  isDeleting?: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────

const RULE_TYPES: RuleType[] = ["weekend", "holiday", "seasonal", "length_of_stay"];

// 0=Mon … 6=Sun
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

function defaultValues(): PricingRuleFormValues {
  return {
    rule_type: "weekend",
    price_modifier: "",
    is_percentage: true,
    start_date: "",
    end_date: "",
    min_nights: "",
    days_of_week: [],
    priority: "0",
    is_active: true,
  };
}

function ruleToFormValues(rule: PricingRule): PricingRuleFormValues {
  return {
    rule_type: rule.rule_type,
    price_modifier: rule.price_modifier,
    is_percentage: rule.is_percentage,
    start_date: rule.start_date ?? "",
    end_date: rule.end_date ?? "",
    min_nights: rule.min_nights != null ? String(rule.min_nights) : "",
    days_of_week: rule.days_of_week,
    priority: String(rule.priority),
    is_active: rule.is_active,
  };
}

function formValuesToPayload(values: PricingRuleFormValues): PricingRulePayload {
  return {
    rule_type: values.rule_type,
    price_modifier: values.price_modifier,
    is_percentage: values.is_percentage,
    start_date: values.start_date || null,
    end_date: values.end_date || null,
    min_nights: values.min_nights ? parseInt(values.min_nights, 10) : null,
    days_of_week: values.days_of_week,
    priority: parseInt(values.priority, 10) || 0,
    is_active: values.is_active,
  };
}

// ── Component ────────────────────────────────────────────────────────────────

export function PricingRuleForm({
  open,
  onClose,
  onSave,
  onDelete,
  rule,
  isSaving = false,
  isDeleting = false,
}: PricingRuleFormProps) {
  const { t } = useTranslation();
  const isEdit = rule != null;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
  } = useForm<PricingRuleFormValues>({ defaultValues: defaultValues() });

  // Sync form state when dialog opens / rule changes
  useEffect(() => {
    if (open) {
      reset(rule ? ruleToFormValues(rule) : defaultValues());
    }
  }, [open, rule, reset]);

  const isPercentage = watch("is_percentage");
  const selectedDays = watch("days_of_week");

  function toggleDay(dayIdx: number) {
    const current = selectedDays;
    if (current.includes(dayIdx)) {
      setValue("days_of_week", current.filter((d) => d !== dayIdx));
    } else {
      setValue("days_of_week", [...current, dayIdx].sort());
    }
  }

  function onSubmit(values: PricingRuleFormValues) {
    onSave(formValuesToPayload(values));
  }

  // Inline toggle button (no Switch component available)
  function InlineToggle({
    checked,
    onChange,
    labelOn,
    labelOff,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    labelOn: string;
    labelOff: string;
  }) {
    return (
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="flex items-center gap-2 text-sm"
        style={{ color: "var(--foreground)" }}
      >
        <span
          className="relative inline-block w-10 h-5 shrink-0"
          style={{
            background: checked ? "var(--primary)" : "var(--muted)",
            borderRadius: "9999px",
            transition: "background 150ms",
          }}
        >
          <span
            className="absolute top-0.5 left-0.5 w-4 h-4"
            style={{
              background: "white",
              borderRadius: "9999px",
              transform: checked ? "translateX(20px)" : "translateX(0)",
              transition: "transform 150ms",
            }}
          />
        </span>
        <span className="label-caps">{checked ? labelOn : labelOff}</span>
      </button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="auth-heading text-base">
            {isEdit ? t("room.pricing.form.editTitle") : t("room.pricing.form.addTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
          {/* Rule Type */}
          <div className="flex flex-col gap-1.5">
            <label className="label-caps">{t("room.pricing.form.ruleType")}</label>
            <Controller
              name="rule_type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RULE_TYPES.map((rt) => (
                      <SelectItem key={rt} value={rt}>
                        {t(`room.pricing.ruleType.${rt}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Modifier + type toggle */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="label-caps">{t("room.pricing.form.modifier")}</label>
              <Controller
                name="is_percentage"
                control={control}
                render={({ field }) => (
                  <InlineToggle
                    checked={field.value}
                    onChange={field.onChange}
                    labelOn={t("room.pricing.form.isPercentage")}
                    labelOff={t("room.pricing.form.isFlat")}
                  />
                )}
              />
            </div>
            <div
              className="flex items-center h-10"
              style={{ border: "1px solid var(--border)" }}
            >
              <Input
                type="number"
                step="0.01"
                {...register("price_modifier")}
                className="border-0 shadow-none focus-visible:ring-0 h-full flex-1 font-semibold tabular-nums"
              />
              <span
                className="px-3 text-xs font-semibold shrink-0"
                style={{
                  borderInlineStart: "1px solid var(--border)",
                  color: "var(--muted-foreground)",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {isPercentage ? "%" : "USD"}
              </span>
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="label-caps">{t("room.pricing.form.startDate")}</label>
              <Input type="date" {...register("start_date")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="label-caps">{t("room.pricing.form.endDate")}</label>
              <Input type="date" {...register("end_date")} />
            </div>
          </div>

          {/* Min nights + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="label-caps">{t("room.pricing.form.minNights")}</label>
              <Input type="number" min={1} {...register("min_nights")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="label-caps">{t("room.pricing.form.priority")}</label>
              <Input type="number" min={0} {...register("priority")} />
            </div>
          </div>

          {/* Days of week */}
          <div className="flex flex-col gap-1.5">
            <label className="label-caps">{t("room.pricing.form.daysOfWeek")}</label>
            <div className="flex gap-1.5 flex-wrap">
              {DAY_KEYS.map((key, idx) => {
                const active = selectedDays.includes(idx);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className="text-xs font-semibold px-2.5 py-1"
                    style={{
                      border: "1px solid var(--border)",
                      background: active ? "var(--primary)" : "var(--card)",
                      color: active ? "var(--primary-foreground)" : "var(--foreground)",
                      transition: "background 100ms, color 100ms",
                    }}
                  >
                    {t(`room.pricing.form.days.${key}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Is Active */}
          <div className="flex items-center gap-3">
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <InlineToggle
                  checked={field.value}
                  onChange={field.onChange}
                  labelOn={t("room.pricing.form.isActive")}
                  labelOff={t("room.pricing.form.isActive")}
                />
              )}
            />
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-2">
            {/* Delete button — only in edit mode */}
            {isEdit && onDelete && (
              <Button
                type="button"
                variant="ghost"
                onClick={onDelete}
                disabled={isDeleting || isSaving}
                className="text-red-500 hover:text-red-600 px-0"
              >
                {t("room.pricing.form.delete")}
              </Button>
            )}

            <div className="flex gap-2 ms-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving || isDeleting}
              >
                {t("room.pricing.form.cancel")}
              </Button>
              <Button type="submit" disabled={isSaving || isDeleting}>
                {t("room.pricing.form.save")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
