interface SectionHeadingProps {
  children: React.ReactNode;
}

export function SectionHeading({ children }: SectionHeadingProps) {
  return (
    <div>
      <h2 className="auth-heading text-base">{children}</h2>
      <div
        className="mt-2 w-full h-px"
        style={{ background: "var(--border)" }}
      />
    </div>
  );
}
