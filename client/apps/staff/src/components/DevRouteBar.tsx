import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";

const DEFAULT_ROUTES = ["/", "/login", "/signup"];

export const DevRouteBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [input, setInput] = useState("");
  const [customRoutes, setCustomRoutes] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!import.meta.env.DEV) return null;

  const allRoutes = [...DEFAULT_ROUTES, ...customRoutes];

  const go = (route: string) => {
    const normalized = route.startsWith("/") ? route : `/${route}`;
    navigate(normalized);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const normalized = input.startsWith("/") ? input : `/${input}`;
    if (!allRoutes.includes(normalized)) {
      setCustomRoutes((prev) => [...prev, normalized]);
    }
    go(normalized);
    setInput("");
    setEditing(false);
  };

  const removeCustom = (route: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomRoutes((prev) => prev.filter((r) => r !== route));
  };

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "#0f0f0f",
        border: "1px solid #2a2a2a",
        borderRadius: 10,
        padding: "6px 8px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        fontFamily: "monospace",
        fontSize: 12,
        flexWrap: "wrap",
        maxWidth: "90vw",
      }}
    >
      {/* Label */}
      <span style={{ color: "#555", marginRight: 2, userSelect: "none" }}>
        ⌘ dev
      </span>

      {/* Route pills */}
      {allRoutes.map((r) => {
        const isActive = location.pathname === r;
        const isCustom = customRoutes.includes(r);
        return (
          <div key={r} style={{ display: "flex", alignItems: "center" }}>
            <button
              onClick={() => go(r)}
              style={{
                color: isActive ? "#000" : "#aaa",
                background: isActive ? "#e8ff5a" : "#1a1a1a",
                border: "1px solid",
                borderColor: isActive ? "#e8ff5a" : "#2e2e2e",
                borderRadius: isCustom ? "4px 0 0 4px" : 4,
                cursor: "pointer",
                padding: "3px 10px",
                transition: "all 0.15s",
                fontFamily: "monospace",
                fontSize: 12,
                fontWeight: isActive ? 700 : 400,
                borderRight: isCustom ? "none" : undefined,
              }}
            >
              {r}
            </button>
            {isCustom && (
              <button
                onClick={(e) => removeCustom(r, e)}
                style={{
                  color: "#555",
                  background: "#1a1a1a",
                  border: "1px solid #2e2e2e",
                  borderLeft: "none",
                  borderRadius: "0 4px 4px 0",
                  cursor: "pointer",
                  padding: "3px 6px",
                  fontFamily: "monospace",
                  fontSize: 11,
                  lineHeight: 1,
                }}
                title="Remove"
              >
                ×
              </button>
            )}
          </div>
        );
      })}

      {/* Divider */}
      <span style={{ color: "#2a2a2a", margin: "0 2px" }}>|</span>

      {/* Input */}
      {editing ? (
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 4 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onBlur={() => {
              if (!input) setEditing(false);
            }}
            onKeyDown={(e) =>
              e.key === "Escape" && (setEditing(false), setInput(""))
            }
            placeholder="/your/route"
            style={{
              background: "#1a1a1a",
              border: "1px solid #e8ff5a",
              borderRadius: 4,
              color: "#e8ff5a",
              fontFamily: "monospace",
              fontSize: 12,
              padding: "3px 8px",
              outline: "none",
              width: 140,
            }}
          />
          <button
            type="submit"
            style={{
              background: "#e8ff5a",
              color: "#000",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              padding: "3px 8px",
              fontFamily: "monospace",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            go
          </button>
        </form>
      ) : (
        <button
          onClick={() => setEditing(true)}
          title="Navigate to custom route"
          style={{
            color: "#555",
            background: "none",
            border: "1px dashed #2e2e2e",
            borderRadius: 4,
            cursor: "pointer",
            padding: "3px 8px",
            fontFamily: "monospace",
            fontSize: 12,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.color = "#e8ff5a";
            (e.target as HTMLButtonElement).style.borderColor = "#e8ff5a";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.color = "#555";
            (e.target as HTMLButtonElement).style.borderColor = "#2e2e2e";
          }}
        >
          + route
        </button>
      )}
    </div>
  );
};
