import { createContext, useContext, ElementType } from "react";

const UIContext = createContext<{ Link: ElementType } | null>(null);

export const UIProvider = ({
  Link,
  children,
}: {
  Link: ElementType;
  children: React.ReactNode;
}) => <UIContext.Provider value={{ Link }}>{children}</UIContext.Provider>;

export const useLink = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("Wrap your app with UIProvider");
  return ctx.Link;
};
