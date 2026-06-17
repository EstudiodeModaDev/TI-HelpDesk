import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import "./RichTextBase64.css";
import { uploadImageToSupabase } from "../../Funcionalidades/shared/UploadFileToSupabase";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  imageSize?: { width: number; height?: number; fit?: "contain" | "cover" };
};

const INLINE_IMAGE_BUCKET = "ticket-inline";

export default function RichTextBase64({value, onChange, placeholder = "Escribe aquí…", readOnly, className = "", imageSize = { width: 480 }}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [hasFocus, setHasFocus] = useState(false);

  // Sincroniza HTML externo → editor
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== value) el.innerHTML = value || "";
  }, [value]);

  const handleInput = () => {
    const el = editorRef.current;
    if (!el) return;
    onChange(el.innerHTML);
  };

  // ¿La selección/caret está dentro del editor?
  const isSelectionInsideEditor = () => {
    const el = editorRef.current;
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0) return false;
    return el.contains(sel.anchorNode);
  };

  const placeCaretAtEnd = (el: HTMLElement) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  const buildImgHTML = (src: string) => {
    const w = imageSize.width;
    const h = imageSize.height;
    const fit = imageSize.fit ?? "contain";

    // width/height por atributo aseguran el tamaño, y style controla el ajuste/overflow
    // max-width:100% evita derrames si el contenedor es más pequeño
    if (h) {
      return `<img src="${src}" width="${w}" height="${h}" style="display:block; object-fit:${fit}; max-width:100%; width:${w}px; height:${h}px;" />`;
    }
    return `<img src="${src}" width="${w}" style="display:block; object-fit:${fit}; max-width:100%; width:${w}px; height:auto;" />`;
  };

  const uploadImage = async (file: File) => {
    const path = `inline/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}`;
    const publicURI = await uploadImageToSupabase(file, INLINE_IMAGE_BUCKET, path);

    if(!publicURI.ok){
      toast.error("No se ha podido subir la imagen, intente nuevamente.")
      throw("Algo ha salido mal subiendo la imagen")
    }
  
    return publicURI.url;
  };
  
  const insertUploadPlaceholder = (label: string) => {
    const el = editorRef.current;
    if (!el) return null;

    if (!isSelectionInsideEditor()) {
      if (!hasFocus) return null;
      el.focus();
      placeCaretAtEnd(el);
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;

    const range = sel.getRangeAt(0);
    range.deleteContents();

    const marker = document.createElement("span");
    const uploadId = crypto.randomUUID();
    marker.className = "rte-upload-placeholder";
    marker.contentEditable = "false";
    marker.textContent = label;
    marker.dataset.uploadId = uploadId;

    range.insertNode(marker);
    range.setStartAfter(marker);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    handleInput();

    return uploadId;
  };

  const insertUploadedImage = async (file: File) => {
    const uploadId = insertUploadPlaceholder(`Subiendo ${file.name || "imagen"}...`);
    if (!uploadId) return;

    try {
      const publicUrl = await uploadImage(file);
      const marker = editorRef.current?.querySelector(`[data-upload-id="${uploadId}"]`);
      if (!marker) return;

      marker.outerHTML = buildImgHTML(publicUrl);
      handleInput();
    } catch (error: any) {
      const marker = editorRef.current?.querySelector(`[data-upload-id="${uploadId}"]`);
      marker?.remove();
      toast.error(error?.message ?? "No se pudo subir la imagen.");
      handleInput();
    }
  };

  // Pegar imágenes (solo si la selección está en el editor)
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
      await insertUploadedImage(file);
    }
  };

  // Drag & drop (solo si la selección está en el editor)
  const handleDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
    if (!isSelectionInsideEditor()) return;
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files ?? []);
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    for (const f of imgs) {
      await insertUploadedImage(f);
    }
  };

  const preventDefault: React.DragEventHandler<HTMLDivElement> = (e) => e.preventDefault();

  // execCommand: bloquea si selección está fuera
  const cmd = (command: string, value?: string) => {
    if (!isSelectionInsideEditor()) return;
    document.execCommand(command, false, value);
    handleInput();
  };

  const Toolbar = useMemo(() => {
    // No permitir que los botones roben el foco al editor
    const btnBase = {
      disabled: !hasFocus || !!readOnly,
      onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
      onPointerDown: (e: React.PointerEvent) => e.preventDefault(),
    };

    return (
      <div className="rte-toolbar" aria-disabled={!hasFocus || !!readOnly}>
        <button type="button" {...btnBase} onClick={() => cmd("bold")} title="Negrita">
          B
        </button>
        <button type="button" {...btnBase} onClick={() => cmd("italic")} title="Cursiva">
          <i>I</i>
        </button>
        <button type="button" {...btnBase} onClick={() => cmd("underline")} title="Subrayado">
          <u>U</u>
        </button>

        <span className="rte-sep" />

        <button type="button" {...btnBase} onClick={() => cmd("insertUnorderedList")} title="Viñetas">
          • List
        </button>
        <button type="button" {...btnBase} onClick={() => cmd("insertOrderedList")} title="Numerada">
          1. List
        </button>

        <span className="rte-sep" />

        <button
          type="button"
          {...btnBase}
          onClick={() => {
            if (!isSelectionInsideEditor()) return;
            const url = prompt("URL del enlace:");
            if (url) cmd("createLink", url);
          }}
          title="Enlace"
        >
          🔗
        </button>

        <button type="button" {...btnBase} title="Insertar imagen" onClick={async () => {
                                                      if (!isSelectionInsideEditor()) return;
                                                      const input = document.createElement("input");
                                                      input.type = "file";
                                                      input.accept = "image/*";
                                                      input.onchange = async () => {
                                                        const f = input.files?.[0];
                                                        if (!f) return;
                                                        await insertUploadedImage(f);
                                                      };
                                                      input.click();
                                                    }}>
          🖼️
        </button>

        <button type="button" {...btnBase} onClick={() => cmd("removeFormat")} title="Limpiar">
          ⨂
        </button>
      </div>
    );
  }, [hasFocus, readOnly]);

  return (
    <div className={`rte ${className}`}>
      {!readOnly && Toolbar}

      <div
        ref={editorRef}
        className="rte-editor"
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
