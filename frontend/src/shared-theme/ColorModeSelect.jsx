import { Box, IconButton } from '@mui/material';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const ColorModeSelect = ({ sx = {} }) => {
  return (
    <Box sx={sx}>
      <IconButton>
        <Brightness7Icon />
      </IconButton>
    </Box>
  );
};

export default ColorModeSelect;
