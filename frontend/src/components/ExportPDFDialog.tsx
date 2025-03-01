import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ExportPDFDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: string) => void;
  exportFormat: string;
  setExportFormat: (format: string) => void;
  availableFormats: string[];
}

export default function ExportPDFDialog({
  open,
  onClose,
  onExport,
  exportFormat,
  setExportFormat,
  availableFormats,
}: ExportPDFDialogProps) {
  const handleExport = () => {
    onExport(exportFormat);
    onClose();
  };

  const handleFormatChange = (event: SelectChangeEvent) => {
    setExportFormat(event.target.value);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Export PDF
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="export-format-label">Export Format</InputLabel>
          <Select
            labelId="export-format-label"
            value={exportFormat}
            label="Export Format"
            onChange={handleFormatChange}
          >
            {availableFormats.map(format => (
              <MenuItem key={format} value={format}>
                {format.toUpperCase()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleExport} variant="contained" color="primary">
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
}
