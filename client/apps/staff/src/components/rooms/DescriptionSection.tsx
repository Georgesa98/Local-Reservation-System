import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Textarea } from "@workspace/ui/components/textarea";
import { SectionHeading } from "./SectionHeading";
import type { RoomFormState } from "../../pages/dashboard/rooms/[id]/SpecificRoom";

const MAX_CHARS = 500;

export function DescriptionSection() {
  const { t } = useTranslation();
  const { register, control } = useFormContext<RoomFormState>();

  // useWatch re-renders only this component (not the parent) on every keystroke
  const description = useWatch<RoomFormState, "description">({
    control,
    name: "description",
    defaultValue: "",
  });

  const charCount = description.length;
  const overLimit = charCount > MAX_CHARS;

  return (
    <section>
      <SectionHeading>{t("room.section.description")}</SectionHeading>

      <div className="mt-5 flex flex-col gap-1.5">
        <label className="label-caps">{t("room.field.marketingCopy")}</label>
        <Textarea
          {...register("description")}
          rows={6}
          maxLength={MAX_CHARS}
          className="resize-none w-full"
          style={{
            border: overLimit
              ? "1px solid var(--destructive)"
              : "1px solid var(--border)",
          }}
        />
        <div className="flex justify-end">
          <span
            className="label-caps tabular-nums"
            style={{
              color: overLimit
                ? "var(--destructive)"
                : "var(--muted-foreground)",
            }}
          >
            {charCount} / {MAX_CHARS} {t("room.chars")}
          </span>
        </div>
      </div>
    </section>
  );
}
