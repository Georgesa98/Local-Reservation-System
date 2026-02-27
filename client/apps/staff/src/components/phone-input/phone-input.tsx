import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { ChevronDownIcon, SearchIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Input } from "@workspace/ui/components/input"
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from "./countries"
import { useTranslation } from "react-i18next"

export interface PhoneInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
  value?: string
  onChange?: (value: string) => void
  onBlur?: React.FocusEventHandler<HTMLInputElement>
  name?: string
}

// Sorted once at module load — longest dial code first to avoid prefix collisions
const SORTED_COUNTRIES = [...COUNTRIES].sort(
  (a, b) => b.dialCode.length - a.dialCode.length
)

function parseValue(value: string): { country: Country; local: string } {
  if (!value) return { country: DEFAULT_COUNTRY, local: "" }
  for (const country of SORTED_COUNTRIES) {
    if (value.startsWith(country.dialCode)) {
      return { country, local: value.slice(country.dialCode.length) }
    }
  }
  return { country: DEFAULT_COUNTRY, local: value.replace(/^\+/, "") }
}

export const PhoneInput = React.memo(
  React.forwardRef<HTMLInputElement, PhoneInputProps>(
    ({ value = "", onChange, onBlur, name, className, ...rest }, ref) => {
      const { t } = useTranslation()
      const parsed = parseValue(value)

      const [selectedCountry, setSelectedCountry] = React.useState<Country>(
        parsed.country
      )
      const [localNumber, setLocalNumber] = React.useState<string>(
        parsed.local
      )
      const [open, setOpen] = React.useState(false)
      const [search, setSearch] = React.useState("")

      // Track the last value we emitted so we can skip syncing when the
      // incoming `value` prop is just our own onChange echoed back by RHF.
      // Only re-parse when the value was changed externally (e.g. form reset).
      const internalValueRef = React.useRef(value)

      React.useEffect(() => {
        if (value === internalValueRef.current) return
        internalValueRef.current = value
        const p = parseValue(value)
        setSelectedCountry(p.country)
        setLocalNumber(p.local)
      }, [value])

      const filteredCountries = React.useMemo(() => {
        if (!search.trim()) return COUNTRIES
        const q = search.toLowerCase()
        return COUNTRIES.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.dialCode.includes(q) ||
            c.code.toLowerCase().includes(q)
        )
      }, [search])

      function handleCountrySelect(country: Country) {
        setSelectedCountry(country)
        setOpen(false)
        setSearch("")
        const next = country.dialCode + localNumber
        internalValueRef.current = next
        onChange?.(next)
      }

      function handleLocalChange(e: React.ChangeEvent<HTMLInputElement>) {
        const digits = e.target.value.replace(/[^\d]/g, "")
        setLocalNumber(digits)
        const next = selectedCountry.dialCode + digits
        internalValueRef.current = next
        onChange?.(next)
      }

      function handleOpenChange(next: boolean) {
        setOpen(next)
        if (!next) setSearch("")
      }

      return (
        <div className={cn("flex items-center gap-0 rtl:flex-row-reverse", className)}>
          {/* Country picker trigger */}
          <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
            <PopoverPrimitive.Trigger asChild>
              <button
                type="button"
                aria-label={`Select country code, currently ${selectedCountry.name} ${selectedCountry.dialCode}`}
                className={cn(
                  "dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 shrink-0 rounded-lg border bg-transparent px-2.5 py-1 text-sm transition-colors focus-visible:ring-3 outline-none",
                  "rounded-r-none border-r-0 rtl:rounded-r-lg rtl:border-r rtl:rounded-l-none rtl:border-l-0",
                  "flex items-center gap-1.5 cursor-pointer hover:bg-muted/50",
                  open && "border-ring ring-ring/50 ring-3"
                )}
              >
                <span className="text-base leading-none select-none">
                  {selectedCountry.flag}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {selectedCountry.dialCode}
                </span>
                <ChevronDownIcon
                  className={cn(
                    "size-3 text-muted-foreground transition-transform",
                    open && "rotate-180"
                  )}
                />
              </button>
            </PopoverPrimitive.Trigger>

            <PopoverPrimitive.Portal>
              <PopoverPrimitive.Content
                side="bottom"
                align="start"
                sideOffset={4}
                className={cn(
                  "bg-background border-border shadow-md ring-foreground/10 z-50 w-72 rounded-xl border p-1 ring-1",
                  "data-[state=open]:animate-in data-[state=closed]:animate-out",
                  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                  "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                  "data-[side=bottom]:slide-in-from-top-2"
                )}
              >
                {/* Search */}
                <div className="flex items-center gap-2 border-b px-2 pb-1 mb-1">
                  <SearchIcon className="size-3.5 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    placeholder={t("phoneInput.searchPlaceholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-7 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    autoFocus
                  />
                </div>

                {/* Country list */}
                <div
                  role="listbox"
                  aria-label="Countries"
                  className="max-h-56 overflow-y-auto"
                >
                  {filteredCountries.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      {t("phoneInput.noResults")}
                    </p>
                  ) : (
                    filteredCountries.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        role="option"
                        aria-selected={country.code === selectedCountry.code}
                        onClick={() => handleCountrySelect(country)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted",
                          country.code === selectedCountry.code &&
                            "bg-muted font-medium"
                        )}
                      >
                        <span className="text-base leading-none select-none w-5 shrink-0">
                          {country.flag}
                        </span>
                         <span className="flex-1 truncate text-start">
                          {country.name}
                        </span>
                        <span className="text-muted-foreground tabular-nums shrink-0">
                          {country.dialCode}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
          </PopoverPrimitive.Root>

          {/* Local number input */}
          <Input
            ref={ref}
            name={name}
            type="tel"
            inputMode="numeric"
            value={localNumber}
            onChange={handleLocalChange}
            onBlur={onBlur}
            placeholder="912 345 678"
            className={cn("rounded-l-none rtl:rounded-l-lg rtl:rounded-r-none", rest.className)}
            {...rest}
          />
        </div>
      )
    }
  )
)

PhoneInput.displayName = "PhoneInput"
