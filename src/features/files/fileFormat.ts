import type { Attachment } from './filesSlice';

/** What the Files upload accepts (the backend enforces the same list). */
export const FILE_ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.md,.vtt,.srt,.json,.png,.jpg,.jpeg,.gif,.webp,.mp3,.m4a,.wav';

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** The uploader or an admin may delete a file (the server applies the same rule). */
export function canDeleteFile(file: Pick<Attachment, 'uploaded_by'>, meId: number | null, isAdmin: boolean): boolean {
  return isAdmin || (meId !== null && file.uploaded_by?.id === meId);
}
