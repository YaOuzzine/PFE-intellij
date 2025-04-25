// src/pages/RateLimitPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Pagination,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { styled } from '@mui/material/styles';
import { fetchGatewayRoutes, updateGatewayRoute } from '../services/dataService';
import {
  fetchRateLimits,
  addRateLimit,
  updateRateLimit,
  deleteRateLimit
} from '../services/rateLimitService';

const TableContainerStyled = styled(TableContainer)(({ theme }) => ({
  marginTop: theme.spacing(2)
}));

const RateLimitPage = () => {
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [maxRequests, setMaxRequests] = useState('');
  const [timeWindowMs, setTimeWindowMs] = useState('');

  const itemsPerPage = 5;
  const DEFAULT_MAX = 10;
  const DEFAULT_WINDOW = 60000;

  const loadData = async () => {
    try {
      // Fetch existing rate limits and routes in parallel
      const [rls, routes] = await Promise.all([
        fetchRateLimits(),
        fetchGatewayRoutes()
      ]);

      const validRouteIds = new Set(routes.map(r => r.id));

      // Delete orphaned rate limits
      const orphaned = rls.filter(rl => !validRouteIds.has(rl.routeId));
      if (orphaned.length) {
        await Promise.all(orphaned.map(or => deleteRateLimit(or.id)));
      }

      // Create missing rate limits with default values
      const existingIds = new Set(rls.map(rl => rl.routeId));
      const missing = routes
        .map(r => r.id)
        .filter(id => !existingIds.has(id));
      if (missing.length) {
        await Promise.all(
          missing.map(id => addRateLimit({ routeId: id, maxRequests: DEFAULT_MAX, timeWindowMs: DEFAULT_WINDOW }))
        );
      }

      // Re-fetch to get updated list
      const updatedRls = await fetchRateLimits();

      // Deduplicate: keep only the latest entry per route
      const byRoute = new Map();
      updatedRls.forEach(rl => {
        const prev = byRoute.get(rl.routeId);
        if (!prev || rl.id > prev.id) byRoute.set(rl.routeId, rl);
      });
      const uniqueRls = Array.from(byRoute.values());

      // Combine with route data
      const combined = uniqueRls.map(rl => {
        const route = routes.find(r => r.id === rl.routeId) || {};
        return {
          rateLimitId: rl.id,
          route,
          maxRequests: rl.maxRequests,
          timeWindowMs: rl.timeWindowMs
        };
      });

      setTableData(combined);
    } catch (error) {
      console.error('Error loading rate limits or routes:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Search & pagination
  const handleSearchChange = e => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  const filtered = tableData.filter(row => {
    const { route, maxRequests, timeWindowMs } = row;
    const text = `${route.id} ${route.predicates || ''} ${maxRequests} ${timeWindowMs} ${route.withRateLimit}`;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  });
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const handleChangePage = (e, value) => setCurrentPage(value);

  // Open update modal
  const handleOpenUpdateModal = row => {
    setSelectedRow(row);
    setMaxRequests(row.maxRequests);
    setTimeWindowMs(row.timeWindowMs);
    setOpenUpdateModal(true);
  };
  const handleCloseUpdateModal = () => {
    setOpenUpdateModal(false);
    setSelectedRow(null);
    setMaxRequests('');
    setTimeWindowMs('');
  };

  // Submit updated rate limit
  const handleSubmitUpdateRateLimit = async () => {
    try {
      await updateRateLimit(selectedRow.rateLimitId, {
        maxRequests: Number(maxRequests),
        timeWindowMs: Number(timeWindowMs)
      });
      await loadData();
      handleCloseUpdateModal();
    } catch (error) {
      console.error('Error updating rate limit:', error);
    }
  };

  // Deactivate rate limit
  const handleDeactivate = async row => {
    if (!row.route.withRateLimit) {
      window.alert('Rate limit already deactivated.');
      return;
    }
    if (!window.confirm('Are you sure you want to deactivate this rate limit?')) return;
    try {
      await updateGatewayRoute(row.route.id, { ...row.route, withRateLimit: false });
      await loadData();
    } catch (error) {
      console.error('Error deactivating rate limit:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h1">Rate Limit Management</Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 2 }}>
        <TextField
          placeholder="Search"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon/></InputAdornment>) }}
          sx={{ width: 250 }}
        />
      </Box>

      <TableContainerStyled component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Gateway Route ID</TableCell>
              <TableCell>Predicate</TableCell>
              <TableCell>Max Requests</TableCell>
              <TableCell>Time Window (ms)</TableCell>
              <TableCell>WithRateLimit</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map(row => (
              <TableRow key={row.rateLimitId}>
                <TableCell>{row.route.id}</TableCell>
                <TableCell>{row.route.predicates}</TableCell>
                <TableCell>{row.maxRequests}</TableCell>
                <TableCell>{row.timeWindowMs}</TableCell>
                <TableCell>{row.route.withRateLimit ? 'True' : 'False'}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    sx={{ mr: 1, textTransform: 'none' }}
                    onClick={() => handleOpenUpdateModal(row)}
                  >Update</Button>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    sx={{ textTransform: 'none' }}
                    onClick={() => handleDeactivate(row)}
                  >Deactivate</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainerStyled>

      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={handleChangePage}
        sx={{ mt: 2 }}
      />

      {/* Update Modal */}
      <Dialog open={openUpdateModal} onClose={handleCloseUpdateModal}>
        <DialogTitle>Update Rate Limit</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Max Requests"
            type="number"
            fullWidth
            value={maxRequests}
            onChange={e => setMaxRequests(e.target.value)}
          />
          <TextField
            label="Time Window (ms)"
            type="number"
            fullWidth
            value={timeWindowMs}
            onChange={e => setTimeWindowMs(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpdateModal} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleSubmitUpdateRateLimit} variant="contained" sx={{ textTransform: 'none' }}>Update</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RateLimitPage;