import { useRef, useState } from "react";
import { Download, ExternalLink, FileImage, FileText, Trash2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadStoredFile, getStoredFileName, isStoredImage, openStoredFile, parseStoredFile, serializeFiles } from "@/lib/files";
import { Button } from "@/components/ui/button";

interface FileUploaderProps {
  label: string;
  description?: string;
  accept?: string;
  value?: string;
  values?: string[];
  onChange?: (value: string) => void;
  onChangeMany?: (values: string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
}

export function FileUploader({
  label,
  description,
  accept,
  value,
  values,
  onChange,
  onChangeMany,
  multiple = false,
  maxFiles = 6,
  className,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const selectedItems = multiple ? values ?? [] : value ? [value] : [];

  const applyFiles = async (list: FileList | File[] | null) => {
    const nextFiles = Array.from(list ?? []);
    if (!nextFiles.length) return;
    const serialized = await serializeFiles(nextFiles);

    if (multiple) {
      onChangeMany?.([...(values ?? []), ...serialized].slice(0, maxFiles));
      return;
    }

    onChange?.(serialized[0]);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium">{label}</label>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(event) => void applyFiles(event.target.files)}
        />
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          void applyFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-5 text-center transition",
          dragActive ? "border-emerald bg-emerald-light" : "border-border bg-muted/30 hover:bg-muted/50",
        )}
      >
        <div className="rounded-full bg-card p-2.5 shadow-sm">
          <UploadCloud className="h-4 w-4 text-emerald" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">{multiple ? "Drop files or click to upload" : "Drop a file or click to upload"}</p>
          {multiple ? <p className="text-xs text-muted-foreground">Up to {maxFiles} files.</p> : null}
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
      </button>

      {selectedItems.length > 0 ? (
        <div className="space-y-3">
          {selectedItems.map((item, index) => {
            const parsed = parseStoredFile(item);
            const image = isStoredImage(item);
            return (
              <div key={`${parsed?.name ?? item}-${index}`} className="flex w-full items-center gap-3 rounded-lg border bg-card p-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                  {image && parsed?.dataUrl ? (
                    <img src={parsed.dataUrl} alt={parsed.name} className="h-full w-full object-cover" />
                  ) : parsed?.dataUrl ? (
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <FileImage className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{getStoredFileName(item)}</p>
                  <p className="text-xs text-muted-foreground">{image ? "Image ready" : "Ready"}</p>
                </div>
                <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => openStoredFile(item)}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => downloadStoredFile(item)}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => {
                    if (multiple) {
                      onChangeMany?.(selectedItems.filter((_, currentIndex) => currentIndex !== index));
                      return;
                    }
                    onChange?.("");
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
