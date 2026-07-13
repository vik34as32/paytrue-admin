import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import type { ServiceMaster } from "@/types/serviceMaster";

export interface ServiceFiltersValue {
  search: string;
  status: string;
  parentId: string;
}

interface ServiceFiltersProps {
  value: ServiceFiltersValue;
  parentOptions: ServiceMaster[];
  isLoadingParents?: boolean;
  onChange: (value: ServiceFiltersValue) => void;
  onSearch: () => void;
  onReset: () => void;
}

export function ServiceFilters({
  value,
  parentOptions,
  isLoadingParents,
  onChange,
  onSearch,
  onReset,
}: ServiceFiltersProps) {
  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              md: "2fr 1fr 1fr auto",
            },
            alignItems: "end",
          }}
        >
          <TextField
            fullWidth
            label="Search by Service Name"
            value={value.search}
            onChange={(e) => onChange({ ...value, search: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
          />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={value.status}
              onChange={(e) => onChange({ ...value, status: e.target.value })}
            >
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth disabled={isLoadingParents}>
            <InputLabel>Parent Service</InputLabel>
            <Select
              label="Parent Service"
              value={value.parentId}
              onChange={(e) => onChange({ ...value, parentId: e.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              {parentOptions.map((service) => (
                <MenuItem key={service.id} value={service.id}>
                  {service.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: "flex", gap: 1, minWidth: { md: 220 } }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={onSearch}
            >
              Search
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RestartAltIcon />}
              onClick={onReset}
            >
              Reset
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
