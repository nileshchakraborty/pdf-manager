import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Slider,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface CompressPDFDialogProps {
  open: boolean;
  onClose: () => void;
  onCompress: (compressionLevel: number) => void;
  compressionLevel: number;
  setCompressionLevel: (level: number) => void;
}

export default function CompressPDFDialog({
  open,
  onClose,
  onCompress,
  compressionLevel,
  setCompressionLevel,
}: CompressPDFDialogProps) {
  const handleCompress = () => {
    onCompress(compressionLevel);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Compress PDF
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
        <Typography gutterBottom>Compression Level</Typography>
        <Slider
          value={compressionLevel}
          onChange={(_: Event, value: number | number[]) =>
            setCompressionLevel(Array.isArray(value) ? value[0] : value)
          }
          min={1}
          max={3}
          step={1}
          marks={[
            { value: 1, label: 'Low' },
            { value: 2, label: 'Medium' },
            { value: 3, label: 'High' },
          ]}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleCompress} variant="contained" color="primary">
          Compress
        </Button>
      </DialogActions>
    </Dialog>
  );
}
