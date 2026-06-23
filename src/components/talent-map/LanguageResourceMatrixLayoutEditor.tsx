"use client";

import { useEffect, useRef, useState } from "react";

type LayoutOffset = {
  x: number;
  y: number;
};

type LayoutMap = Record<string, LayoutOffset>;

type DragState = {
  id: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

const STORAGE_KEY = "blackdog-language-resource-matrix-layout";
const ROOT_SELECTOR = ".language-resource-matrix-section";
const MOVABLE_SELECTOR = "[data-matrix-movable]";

function applyLayout(layout: LayoutMap) {
  const root = document.querySelector<HTMLElement>(ROOT_SELECTOR);
  if (!root) return;

  root.querySelectorAll<HTMLElement>(MOVABLE_SELECTOR).forEach((element) => {
    const id = element.dataset.matrixMovable;
    if (!id) return;

    const offset = layout[id] ?? { x: 0, y: 0 };
    element.style.setProperty("--matrix-x", `${offset.x}px`);
    element.style.setProperty("--matrix-y", `${offset.y}px`);
  });
}

function normalizeLayout(rawLayout: unknown): LayoutMap {
  if (!rawLayout || typeof rawLayout !== "object") return {};

  return Object.entries(rawLayout as Record<string, unknown>).reduce<LayoutMap>((layout, [id, value]) => {
    if (!value || typeof value !== "object") return layout;

    const maybeOffset = value as Partial<LayoutOffset>;
    const x = Number(maybeOffset.x);
    const y = Number(maybeOffset.y);

    if (Number.isFinite(x) && Number.isFinite(y)) {
      layout[id] = { x: Math.round(x), y: Math.round(y) };
    }

    return layout;
  }, {});
}

function getSavedLayout() {
  if (typeof window === "undefined") return {};

  try {
    const savedLayout = window.localStorage.getItem(STORAGE_KEY);
    return savedLayout ? normalizeLayout(JSON.parse(savedLayout)) : {};
  } catch {
    return {};
  }
}

export function LanguageResourceMatrixLayoutEditor() {
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useState<LayoutMap>(() => getSavedLayout());
  const [notice, setNotice] = useState("");
  const layoutRef = useRef<LayoutMap>(layout);
  const dragStateRef = useRef<DragState | null>(null);

  useEffect(() => {
    layoutRef.current = layout;
    applyLayout(layout);
  }, [layout]);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(ROOT_SELECTOR);
    if (!root) return undefined;

    root.classList.toggle("is-layout-editing", isEditing);

    return () => {
      root.classList.remove("is-layout-editing");
    };
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) return undefined;

    const root = document.querySelector<HTMLElement>(ROOT_SELECTOR);
    if (!root) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.closest("[data-matrix-editor-control]")) return;

      const movable = target.closest<HTMLElement>(MOVABLE_SELECTOR);
      if (!movable || !root.contains(movable)) return;

      const id = movable.dataset.matrixMovable;
      if (!id) return;

      event.preventDefault();
      event.stopPropagation();
      movable.setPointerCapture?.(event.pointerId);

      const origin = layoutRef.current[id] ?? { x: 0, y: 0 };
      dragStateRef.current = {
        id,
        startX: event.clientX,
        startY: event.clientY,
        originX: origin.x,
        originY: origin.y,
      };
    };

    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState) return;

      event.preventDefault();
      const nextLayout = {
        ...layoutRef.current,
        [dragState.id]: {
          x: Math.round(dragState.originX + event.clientX - dragState.startX),
          y: Math.round(dragState.originY + event.clientY - dragState.startY),
        },
      };

      layoutRef.current = nextLayout;
      setLayout(nextLayout);
      applyLayout(nextLayout);
    };

    const handlePointerUp = () => {
      if (!dragStateRef.current) return;

      dragStateRef.current = null;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(layoutRef.current));
        setNotice("Layout saved locally.");
      } catch {
        setNotice("Layout is active for this session.");
      }
    };

    const preventEditedClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.closest("[data-matrix-editor-control]")) return;
      if (!target.closest(MOVABLE_SELECTOR)) return;

      event.preventDefault();
      event.stopPropagation();
    };

    root.addEventListener("pointerdown", handlePointerDown, true);
    root.addEventListener("click", preventEditedClick, true);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      root.removeEventListener("pointerdown", handlePointerDown, true);
      root.removeEventListener("click", preventEditedClick, true);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      dragStateRef.current = null;
    };
  }, [isEditing]);

  const handleEditToggle = () => {
    setIsEditing((editing) => !editing);
    setNotice("");
  };

  const handleResetLayout = () => {
    layoutRef.current = {};
    setLayout({});
    applyLayout({});
    setNotice("Layout reset.");

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      setNotice("Layout reset for this session.");
    }
  };

  const handleCopyLayout = async () => {
    const exportedLayout = JSON.stringify(
      {
        component: "LanguageResourceMatrix",
        offsets: layoutRef.current,
      },
      null,
      2,
    );

    try {
      await navigator.clipboard?.writeText(exportedLayout);
      setNotice("Layout JSON copied.");
    } catch {
      setNotice(exportedLayout);
    }
  };

  return (
    <div className="language-resource-matrix-layout-tools" data-matrix-editor-control="true">
      <div className="language-resource-matrix-layout-actions">
        <button type="button" onClick={handleEditToggle}>
          {isEditing ? "Done" : "Edit Layout"}
        </button>
        {isEditing ? (
          <>
            <button type="button" onClick={handleCopyLayout}>
              Copy JSON
            </button>
            <button type="button" onClick={handleResetLayout}>
              Reset
            </button>
          </>
        ) : null}
      </div>
      {notice ? <div className="language-resource-matrix-layout-notice">{notice}</div> : null}
    </div>
  );
}
