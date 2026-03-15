import { Download, ExternalLink, FileImage, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { downloadStoredFile, getStoredFileName, isStoredImage, openStoredFile } from "@/lib/files";

interface StoredFileListProps {
  files: Array<string | undefined | null>;
  emptyLabel?: string;
  className?: string;
}

export function StoredFileList({ files, emptyLabel = "No files added", className }: StoredFileListProps) {
  const visibleFiles = files.filter(Boolean) as string[];

  if (visibleFiles.length === 0) {
    return <p className={cn("text-sm text-muted-foreground", className)}>{emptyLabel}</p>;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {visibleFiles.map((file, index) => {
        const image = isStoredImage(file);
        return (
          <div key={`${file}-${index}`} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
              {image ? <FileImage className="h-4 w-4 text-muted-foreground" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{getStoredFileName(file)}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openStoredFile(file)}>
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadStoredFile(file)}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
