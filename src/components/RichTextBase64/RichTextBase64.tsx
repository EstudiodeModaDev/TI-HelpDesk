import React, {useEffect, useMemo, useRef, useState} from "react";
import "./RichTextBase64.css";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
};

export default function RichTextBase64({value, onChange, placeholder = "Escribe aquí…", readOnly, className = "",}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [hasFocus, setHasFocus] = useState(false);

  // Sincroniza HTML externo → editor
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== value) el.innerHTML = value || "";
  }, [value]);

  const handleInput = () => {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML);
  };

  // Utilidades de selección
  const isSelectionInsideEditor = () => {
    const el = editorRef.current;
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0) return false;
    const anchor = sel.anchorNode;
    return !!anchor && el.contains(anchor);
  };

  const placeCaretAtEnd = (el: HTMLElement) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  // Inserta HTML sólo si el foco/selección están en el editor
  const insertHTMLAtCursor = (html: string) => {
    const el = editorRef.current;
    if (!el) return;
    if (!isSelectionInsideEditor()) {
      if (!hasFocus) return;             // bloquea si no hay foco
      el.focus();                         // si hay foco pero la selección se fue, corrige
      placeCaretAtEnd(el);
    }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const frag = range.createContextualFragment(html);
    range.insertNode(frag);
    sel.collapseToEnd();
    handleInput();
  };

  // File → dataURL
  const fileToDataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });

  // Pegar imágenes (sólo si el foco está en el editor)
  const handlePaste: React.ClipboardEventHandler<HTMLDivElement> = async (e) => {
    if (!isSelectionInsideEditor()) return;
    if (!e.clipboardData) return;
    const files: File[] = [];
    for (const item of e.clipboardData.items) {
      if (item.kind === "file") {
        const f = item.getAsFile();
        if (f && f.type.startsWith("image/")) files.push(f);
      }
    }
    if (files.length === 0) return;

    e.preventDefault();
    for (const file of files) {
      const dataUrl = await fileToDataURL(file);
      insertHTMLAtCursor(`<img src="${dataUrl}" style="max-width:100%;height:auto;" />`);
    }
  };

  // Drag & drop (sólo si hay foco)
  const handleDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
    if (!isSelectionInsideEditor()) return;
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files ?? []);
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    for (const f of imgs) {
      const dataUrl = await fileToDataURL(f);
      insertHTMLAtCursor(`<img src="${dataUrl}" style="max-width:100%;height:auto;" />`);
    }
  };
  const preventDefault: React.DragEventHandler<HTMLDivElement> = (e) => e.preventDefault();

  // execCommand: bloquea si no está enfocado / selección fuera
  const cmd = (command: string, value?: string) => {
    const el = editorRef.current;
    if (!el || !isSelectionInsideEditor()) return;
    document.execCommand(command, false, value);
    handleInput();
  };

  const Toolbar = useMemo(
    () => (
      <div className="rte-toolbar" aria-disabled={!hasFocus || !!readOnly}>
        <button type="button" disabled={!hasFocus || !!readOnly} onClick={() => cmd("bold")} title="Negrita" onFocus={() => setHasFocus(true) } onBlur={() => setHasFocus(false)}>B</button>
        <button type="button" disabled={!hasFocus || !!readOnly} onClick={() => cmd("italic")} onFocus={() => setHasFocus(true) } onBlur={() => setHasFocus(false)} title="Cursiva"><i>I</i></button>
        <button type="button" disabled={!hasFocus || !!readOnly} onClick={() => cmd("underline")}  onFocus={() => setHasFocus(true) } onBlur={() => setHasFocus(false)}title="Subrayado"><u>U</u></button>
        <span className="rte-sep" />
        <button type="button" disabled={!hasFocus || !!readOnly} onClick={() => cmd("insertUnorderedList")} onFocus={() => setHasFocus(true) } onBlur={() => setHasFocus(false)} title="Viñetas">• List</button>
        <button type="button" disabled={!hasFocus || !!readOnly} onClick={() => cmd("insertOrderedList")} onFocus={() => setHasFocus(true) } onBlur={() => setHasFocus(false)} title="Numerada">1. List</button>
        <span className="rte-sep" />
        <button type="button" onFocus={() => setHasFocus(true) } onBlur={() => setHasFocus(false)}
          disabled={!hasFocus || !!readOnly}
          onClick={() => {
            const el = editorRef.current;
            if (!el || !hasFocus || !isSelectionInsideEditor()) return;
            const url = prompt("URL del enlace:");
            if (url) cmd("createLink", url);
          }}
          title="Enlace"
        >
          🔗
        </button>
        <button
          type="button"
          disabled={!hasFocus || !!readOnly}
          onClick={async () => {
            const el = editorRef.current;
            if (!el || !hasFocus || !isSelectionInsideEditor()) return;
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = async () => {
              const f = input.files?.[0];
              if (!f) return;
              const dataUrl = await fileToDataURL(f);
              insertHTMLAtCursor(`<img src="${dataUrl}" style="max-width:100%;height:auto;" />`);
            };
            input.click();
          }}
          title="Insertar imagen"
        >
          🖼️
        </button>
        <button type="button" disabled={!hasFocus || !!readOnly} onClick={() => cmd("removeFormat")} title="Limpiar">⨂</button>
      </div>
    ),
    [hasFocus, readOnly]
  );

  return (
    <div className={`rte ${className}`}>
      {!readOnly && Toolbar}
      <div ref={editorRef} className="rte-editor"
        contentEditable={!readOnly}
        onInput={handleInput}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={preventDefault}
        onDragEnter={preventDefault}
        onDragLeave={preventDefault}
        onFocus={() => setHasFocus(true)}
        onBlur={() => setHasFocus(false)}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
}
