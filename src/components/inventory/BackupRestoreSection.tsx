import { useState, useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { importBackup } from '@/lib/backup';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function BackupRestoreSection() {
  const [confirmImport, setConfirmImport] = useState(false);
  const [pendingData, setPendingData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    window.open('/api/export-backup', '_blank');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.version || !data.exportedAt) {
          setError('Invalid backup file');
          return;
        }
        setPendingData(data);
        setConfirmImport(true);
      } catch {
        setError('Invalid JSON file');
      }
    };
    reader.readAsText(file);

    // Reset file input so re-selecting the same file triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingData) return;
    try {
      await importBackup(pendingData as Parameters<typeof importBackup>[0]);
      setConfirmImport(false);
      setPendingData(null);
      window.location.reload();
    } catch {
      setError('Failed to import backup');
      setConfirmImport(false);
      setPendingData(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Export all your data as a JSON file, or restore from a previous backup.
      </p>

      <div className="flex gap-2">
        <Button onClick={handleExport} className="flex-1">
          <Download className="w-4 h-4 mr-2" />
          Export Backup
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          Import Backup
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <AlertDialog open={confirmImport} onOpenChange={(open) => { if (!open) { setConfirmImport(false); setPendingData(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import Backup</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace all existing data with the backup. This action cannot be undone. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport}>
              Import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
