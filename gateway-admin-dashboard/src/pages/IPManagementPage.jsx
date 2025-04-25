// src/pages/IPManagementPage.jsx
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
  DialogActions,
  CircularProgress,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { styled } from '@mui/material/styles';
import {
  fetchIpAddresses,
  addIpAddress,
  updateIpAddress,
  deleteIpAddress
} from '../services/ipService';
import { fetchGatewayRoutes } from '../services/dataService';

const TableContainerStyled = styled(TableContainer)(({ theme }) => ({
  marginTop: theme.spacing(2)
}));

const ITEMS_PER_PAGE = 5;

const IPManagementPage = () => {
  const [ips, setIps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [openAdd, setOpenAdd] = useState(false);
  const [addForm, setAddForm] = useState({ ip: '', routeId: '' });

  const [openUpdate, setOpenUpdate] = useState(false);
  const [updateForm, setUpdateForm] = useState({ id: null, ip: '', gatewayRouteId: null });

  //-----------------------------------
  // Load IPs + predicates
  //-----------------------------------
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ipData, routes] = await Promise.all([
        fetchIpAddresses(),
        fetchGatewayRoutes()
      ]);
      const predicateMap = new Map(routes.map(r => [r.id, r.predicates || '']));
      const enriched = ipData.map(ip => ({ ...ip, predicate: predicateMap.get(ip.gatewayRouteId) || '' }));
      setIps(enriched);
    } catch (e) {
      console.error(e);
      setError('Unable to load IP addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  //-----------------------------------
  // Derived lists
  //-----------------------------------
  const filtered = ips.filter(r =>
    `${r.id} ${r.gatewayRouteId} ${r.predicate || ''} ${r.ip}`.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  //-----------------------------------
  // CRUD actions
  //-----------------------------------
  const handleAdd = async () => {
    if (!addForm.ip || !addForm.routeId) { alert('Both IP and Route ID are required'); return; }
    try {
      await addIpAddress({ ip: addForm.ip, gatewayRoute: { id: Number(addForm.routeId) } });
      setOpenAdd(false); setAddForm({ ip: '', routeId: '' }); await load();
    } catch (e) { console.error(e); alert('Failed to add IP'); }
  };

  const handleUpdate = async () => {
    if (!updateForm.ip) { alert('IP cannot be empty'); return; }
    try {
      await updateIpAddress(updateForm.id, { ip: updateForm.ip, gatewayRoute: { id: updateForm.gatewayRouteId } });
      setOpenUpdate(false); await load();
    } catch (e) { console.error(e); alert('Failed to update IP'); }
  };

  const handleDelete = async (id, routeId) => {
    if (!window.confirm('Delete this IP address?')) return;
    try { await deleteIpAddress(id, routeId); await load(); }
    catch (e) { console.error(e); alert('Failed to delete IP'); }
  };

  //-----------------------------------
  // UI
  //-----------------------------------
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5">IP Management</Typography>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {/* Search + Add */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 2 }}>
        <TextField
          placeholder="Search"
          size="small"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
          sx={{ width: 280 }}
        />
        <Button variant="contained" onClick={() => setOpenAdd(true)} sx={{ textTransform: 'none' }}>
          Add New IP
        </Button>
      </Box>

      {/* Table */}
      <TableContainerStyled component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>IP&nbsp;ID</TableCell>
              <TableCell>Gateway&nbsp;Route&nbsp;ID</TableCell>
              <TableCell>Predicate</TableCell>
              <TableCell>IP&nbsp;Address</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} /></TableCell></TableRow>
            ) : paginated.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center">No IP addresses</TableCell></TableRow>
            ) : (
              paginated.map(row => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.gatewayRouteId}</TableCell>
                  <TableCell>{row.predicate}</TableCell>
                  <TableCell>{row.ip}</TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="contained" color="success" sx={{ mr: 1, textTransform: 'none' }}
                      onClick={() => { setUpdateForm(row); setOpenUpdate(true); }}>
                      Update
                    </Button>
                    <Button size="small" variant="contained" color="error" sx={{ textTransform: 'none' }}
                      onClick={() => handleDelete(row.id, row.gatewayRouteId)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainerStyled>

      <Pagination page={page} count={totalPages} onChange={(_, v) => setPage(v)} sx={{ mt: 2 }} />

      {/* Add Modal */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)}>
        <DialogTitle>Add New IP</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="IP Address" fullWidth value={addForm.ip} onChange={e => setAddForm(p => ({ ...p, ip: e.target.value }))} />
          <TextField label="Route ID" type="number" fullWidth value={addForm.routeId} onChange={e => setAddForm(p => ({ ...p, routeId: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Update Modal */}
      <Dialog open={openUpdate} onClose={() => setOpenUpdate(false)}>
        <DialogTitle>Update IP</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField fullWidth label="IP Address" value={updateForm.ip} onChange={e => setUpdateForm(p => ({ ...p, ip: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUpdate(false)}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IPManagementPage;