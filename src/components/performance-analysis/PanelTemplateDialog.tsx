import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Chip,
  Box,
  Tabs,
  Tab,
  Checkbox,
} from '@mui/material';
import {
  Memory as MemoryIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Add as AddIcon,
  Speed as CpuIcon,
} from '@mui/icons-material';
import { panelTemplates, type PanelTemplate, getAllCategories } from '../../config/panelTemplates';

interface PanelTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (templates: PanelTemplate[]) => void;
  operatingSystem?: string;
}

const iconMap: Record<string, React.ReactElement> = {
  cpu: <CpuIcon fontSize="large" />,
  memory: <MemoryIcon fontSize="large" />,
  storage: <StorageIcon fontSize="large" />,
  network: <NetworkIcon fontSize="large" />,
  add: <AddIcon fontSize="large" />,
};

const PanelTemplateDialog: React.FC<PanelTemplateDialogProps> = ({
  open,
  onClose,
  onSelectTemplate,
  operatingSystem = 'observability-node',
}) => {
  const categories = getAllCategories();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
console.log(operatingSystem, selectedCategory, selectedTemplates);

  // Filter templates by operating system first, then by category
  const osFilteredTemplates = panelTemplates.filter(template => {
    // Handle undefined operatingSystem safely
    const templateOS = template.operatingSystem?.toLowerCase() || '';
    const targetOS = operatingSystem?.toLowerCase() || '';
    return templateOS === targetOS;
  });
  

  const filteredTemplates =
    selectedCategory === 'All'
      ? osFilteredTemplates
      : osFilteredTemplates.filter(template => template.category === selectedCategory);

  const handleCategoryChange = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedCategory(newValue);
  };

  const handleToggleTemplate = (templateId: string) => {
    setSelectedTemplates(prev => {
      if (prev.includes(templateId)) {
        return prev.filter(id => id !== templateId);
      } else {
        return [...prev, templateId];
      }
    });
  };

  const handleCreatePanel = () => {
    const templates = panelTemplates.filter(t => selectedTemplates.includes(t.id));
    onSelectTemplate(templates);
    setSelectedTemplates([]);
    onClose();
  };

  const handleCancel = () => {
    setSelectedTemplates([]);
    onClose();
  };

  const isTemplateSelected = (templateId: string) => selectedTemplates.includes(templateId);

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '70vh',
          maxHeight: '85vh',
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="div">
          Choose Panel Templates
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select one or more templates to combine into a single panel
        </Typography>
        {selectedTemplates.length > 0 && (
          <Chip
            label={`${selectedTemplates.length} template${selectedTemplates.length > 1 ? 's' : ''} selected`}
            color="primary"
            size="small"
            sx={{ mt: 1 }}
          />
        )}
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={selectedCategory} onChange={handleCategoryChange} aria-label="panel categories">
            <Tab label="All" value="All" />
            {categories.map(category => (
              <Tab key={category} label={category} value={category} />
            ))}
          </Tabs>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 2,
          }}
        >
          {filteredTemplates.map(template => (
            <Box key={template.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: isTemplateSelected(template.id) ? '2px solid' : '1px solid',
                  borderColor: isTemplateSelected(template.id) ? 'primary.main' : 'divider',
                  backgroundColor: isTemplateSelected(template.id) ? 'action.selected' : 'background.paper',
                  transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                    borderColor: 'primary.main',
                  },
                }}
              >
                <CardActionArea
                  onClick={() => handleToggleTemplate(template.id)}
                  sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                >
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center', position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
                      <Checkbox
                        checked={isTemplateSelected(template.id)}
                        color="primary"
                      />
                    </Box>
                    <Box sx={{ mb: 2, color: 'primary.main' }}>
                      {iconMap[template.icon] || <AddIcon fontSize="large" />}
                    </Box>
                    <Typography variant="h6" component="div" gutterBottom>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {template.description}
                    </Typography>
                    <Chip
                      label={template.category}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </CardContent>
                </CardActionArea>
              </Card>
            </Box>
          ))}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel} color="inherit">
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleCreatePanel}
          disabled={selectedTemplates.length === 0}
        >
          Create Panel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PanelTemplateDialog;
