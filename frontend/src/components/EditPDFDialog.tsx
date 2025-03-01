import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tabs,
  Tab,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FormatAlignLeft, FormatAlignCenter, FormatAlignRight } from '@mui/icons-material';

interface EditConfig {
  operation: 'add-text' | 'remove-text' | 'replace-text';
  page: number;
  text?: string;
  font?: string;
  fontSize?: number;
  alignment?: 'left' | 'center' | 'right';
  position?: {
    x: number;
    y: number;
  };
}

interface EditPDFDialogProps {
  open: boolean;
  onClose: () => void;
  onEdit: (editConfig: EditConfig) => void;
}

const OPERATIONS = ['add-text', 'remove-text', 'replace-text'] as const;
type Operation = (typeof OPERATIONS)[number];

const ALIGNMENTS = ['left', 'center', 'right'] as const;
type Alignment = (typeof ALIGNMENTS)[number];

export default function EditPDFDialog({ open, onClose, onEdit }: EditPDFDialogProps) {
  const [currentOperation, setCurrentOperation] = useState<Operation>('add-text');
  const [page, setPage] = useState(1);
  const [text, setText] = useState('');
  const [font, setFont] = useState('Arial');
  const [fontSize, setFontSize] = useState(12);
  const [alignment, setAlignment] = useState<Alignment>('left');
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleSubmit = () => {
    onEdit({
      operation: currentOperation,
      page,
      text,
      font,
      fontSize,
      alignment,
      position,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Edit PDF
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
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={currentOperation}
            onChange={(_, newValue: Operation) => setCurrentOperation(newValue)}
          >
            {OPERATIONS.map(op => (
              <Tab key={op} value={op} label={op.replace('-', ' ')} />
            ))}
          </Tabs>
        </Box>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <TextField
            label="Page Number"
            type="number"
            value={page}
            onChange={e => setPage(parseInt(e.target.value))}
            inputProps={{ min: 1 }}
          />
        </FormControl>

        {currentOperation !== 'remove-text' && (
          <>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                label="Text"
                value={text}
                onChange={e => setText(e.target.value)}
                multiline
                rows={4}
              />
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Font</InputLabel>
              <Select value={font} label="Font" onChange={e => setFont(e.target.value)}>
                <MenuItem value="Arial">Arial</MenuItem>
                <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                <MenuItem value="Courier">Courier</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                label="Font Size"
                type="number"
                value={fontSize}
                onChange={e => setFontSize(parseInt(e.target.value))}
                inputProps={{ min: 8, max: 72 }}
              />
            </FormControl>

            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>Alignment</Typography>
              <ToggleButtonGroup
                value={alignment}
                exclusive
                onChange={(_, newAlignment: Alignment) => setAlignment(newAlignment)}
              >
                <ToggleButton value="left">
                  <FormatAlignLeft />
                </ToggleButton>
                <ToggleButton value="center">
                  <FormatAlignCenter />
                </ToggleButton>
                <ToggleButton value="right">
                  <FormatAlignRight />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>Position</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="X"
                    type="number"
                    value={position.x}
                    onChange={e => setPosition({ ...position, x: parseInt(e.target.value) })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Y"
                    type="number"
                    value={position.y}
                    onChange={e => setPosition({ ...position, y: parseInt(e.target.value) })}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
}
