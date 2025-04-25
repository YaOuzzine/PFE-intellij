// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Typography,
  Box,
  Grid,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Pagination,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import ComputerIcon from '@mui/icons-material/Computer';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { styled } from '@mui/material/styles';
import {
  fetchGatewayRoutes,
  addGatewayRoute,
  updateGatewayRoute,
  deleteGatewayRoute
} from '../services/dataService';

const MetricCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  height: '100%'
}));

const DashboardPage = () => {
  // States for sorting, pagination, search, and routes.
  const [sortBy, setSortBy] = useState('oldest');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [routes, setRoutes] = useState([]);
  const [metrics, setMetrics] = useState({
    totalRoutes: 0,
    authorizedPersonnel: 0 // static value for now
  });

  // State for per‑minute metrics including accepted and rejected values.
  const [minuteMetrics, setMinuteMetrics] = useState({
    requestsCurrentMinute: 0,
    requestsPreviousMinute: 0,
    rejectedCurrentMinute: 0,
    rejectedPreviousMinute: 0,
    increasePercentage: 0,
    rejectedIncreasePercentage: 0
  });

  // State for global request counters.
  const [requestCount, setRequestCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  // Modal states for adding/updating routes and viewing IP addresses.
  const [openAddModal, setOpenAddModal] = useState(false);
  const [newRoute, setNewRoute] = useState({
    predicates: '',
    uri: '',
    withToken: false,
    withRateLimit: false,
    withIpFilter: false
  });
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [routeToUpdate, setRouteToUpdate] = useState(null);
  const [openIpsModal, setOpenIpsModal] = useState(false);
  const [ipsToShow, setIpsToShow] = useState([]);

  // Function to load routes.
  const loadRoutes = async () => {
    try {
      const data = await fetchGatewayRoutes();
      setRoutes(data);
      setMetrics({
        totalRoutes: data.length,
        authorizedPersonnel: 25 // example static value
      });
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  // Fetch global request counters (accepted and rejected).
  const fetchRequestCounter = async () => {
    try {
      const response = await axios.get(
        'http://localhost:9080/api/metrics/requests'
      );
      const { requestCount, rejectedCount } = response.data;
      setRequestCount(requestCount);
      setRejectedCount(rejectedCount);
    } catch (error) {
      console.error('Error fetching request counter:', error);
    }
  };

  // Fetch per‑minute metrics.
  const fetchMinuteMetrics = async () => {
    try {
      const response = await axios.get(
        'http://localhost:9080/api/metrics/minutely'
      );
      const {
        requestsCurrentMinute,
        requestsPreviousMinute,
        rejectedCurrentMinute,
        rejectedPreviousMinute
      } = response.data;

      let increasePercentage = 0;
      if (requestsPreviousMinute > 0) {
        increasePercentage = Math.round(
          ((requestsCurrentMinute - requestsPreviousMinute) /
            requestsPreviousMinute) *
            100
        );
      } else if (
        requestsPreviousMinute === 0 &&
        requestsCurrentMinute > 0
      ) {
        increasePercentage = 100;
      }

      let rejectedIncreasePercentage = 0;
      if (rejectedPreviousMinute > 0) {
        rejectedIncreasePercentage = Math.round(
          ((rejectedCurrentMinute - rejectedPreviousMinute) /
            rejectedPreviousMinute) *
            100
        );
      } else if (
        rejectedPreviousMinute === 0 &&
        rejectedCurrentMinute > 0
      ) {
        rejectedIncreasePercentage = 100;
      }

      setMinuteMetrics({
        requestsCurrentMinute,
        requestsPreviousMinute,
        rejectedCurrentMinute,
        rejectedPreviousMinute,
        increasePercentage,
        rejectedIncreasePercentage
      });
    } catch (error) {
      console.error('Error fetching minute metrics:', error);
    }
  };

  useEffect(() => {
    loadRoutes();
    fetchRequestCounter();
    fetchMinuteMetrics();

    const intervalCounter = setInterval(fetchRequestCounter, 1000);
    const intervalMinute = setInterval(fetchMinuteMetrics, 1000);
    return () => {
      clearInterval(intervalCounter);
      clearInterval(intervalMinute);
    };
  }, []);

  // Filtering, sorting, and pagination for routes.
  const filteredRoutes = routes.filter((route) =>
    JSON.stringify(route).toLowerCase().includes(searchTerm.toLowerCase())
  );
  const sortedRoutes = [...filteredRoutes].sort((a, b) =>
    sortBy === 'newest' ? b.id - a.id : a.id - b.id
  );
  const itemsPerPage = 5;
  const totalPages = Math.ceil(sortedRoutes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = sortedRoutes.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleChangePage = (event, value) => setCurrentPage(value);
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };
  const handleSortChange = (order) => setSortBy(order);

  // Modal handlers for adding/updating routes.
  const handleOpenAddModal = () => setOpenAddModal(true);
  const handleCloseAddModal = () => {
    setOpenAddModal(false);
    setNewRoute({
      predicates: '',
      uri: '',
      withToken: false,
      withRateLimit: false,
      withIpFilter: false
    });
  };
  const handleNewRouteChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewRoute((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  const handleSubmitAddRoute = async () => {
    try {
      // Create a copy of the new route
      const payload = { ...newRoute };
      
      // Explicitly convert the filter values to boolean
      if (typeof payload.withToken === 'string') {
        payload.withToken = payload.withToken === 'true';
      }
      
      if (typeof payload.withRateLimit === 'string') {
        payload.withRateLimit = payload.withRateLimit === 'true';
      }
      
      if (typeof payload.withIpFilter === 'string') {
        payload.withIpFilter = payload.withIpFilter === 'true';
      }
      
      await addGatewayRoute(payload);
      await loadRoutes();
      handleCloseAddModal();
    } catch (error) {
      console.error('Error adding route:', error);
    }
  };
  const handleOpenUpdateModal = (route) => {
    setRouteToUpdate(route);
    setOpenUpdateModal(true);
  };
  const handleCloseUpdateModal = () => {
    setOpenUpdateModal(false);
    setRouteToUpdate(null);
  };
  const handleUpdateRouteChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRouteToUpdate((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  const handleSubmitUpdateRoute = async () => {
    try {
      // Create a copy of the route to update
      const payload = { ...routeToUpdate };
      
      // Explicitly convert the filter values to boolean
      if (typeof payload.withToken === 'string') {
        payload.withToken = payload.withToken === 'true';
      }
      
      if (typeof payload.withRateLimit === 'string') {
        payload.withRateLimit = payload.withRateLimit === 'true';
      }
      
      if (typeof payload.withIpFilter === 'string') {
        payload.withIpFilter = payload.withIpFilter === 'true';
      }
      
      await updateGatewayRoute(routeToUpdate.id, payload);
      await loadRoutes();
      handleCloseUpdateModal();
    } catch (error) {
      console.error('Error updating route:', error);
    }
  };
  const handleDeleteRoute = async (id) => {
    try {
      await deleteGatewayRoute(id);
      await loadRoutes();
    } catch (error) {
      console.error('Error deleting route:', error);
    }
  };
  const handleViewIps = (route) => {
    if (!route.allowedIps || route.allowedIps.length === 0) {
      alert('No IP addresses found for this route.');
      return;
    }
    setIpsToShow(route.allowedIps);
    setOpenIpsModal(true);
  };
  const handleCloseIpsModal = () => {
    setOpenIpsModal(false);
    setIpsToShow([]);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}
      >
        <Typography variant="h4">Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant={sortBy === 'oldest' ? 'contained' : 'outlined'}
            onClick={() => handleSortChange('oldest')}
            sx={{ textTransform: 'none' }}
          >
            Oldest
          </Button>
          <Button
            variant={sortBy === 'newest' ? 'contained' : 'outlined'}
            onClick={() => handleSortChange('newest')}
            sx={{ textTransform: 'none' }}
          >
            Newest
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenAddModal}
            sx={{ textTransform: 'none' }}
          >
            Add New Route
          </Button>
        </Box>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Routes */}
        <Grid item xs={12} md={3}>
          <MetricCard elevation={0}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  backgroundColor: '#e8f5e9',
                  borderRadius: '50%',
                  p: 1.5,
                  mr: 2
                }}
              >
                <PeopleOutlineIcon />
              </Box>
              <Box>
                <Typography color="textSecondary" variant="subtitle2">
                  Total Routes
                </Typography>
                <Typography variant="h4">
                  {metrics.totalRoutes}
                </Typography>
              </Box>
            </Box>
          </MetricCard>
        </Grid>

        {/* Accepted Requests This Minute */}
        <Grid item xs={12} md={3}>
          <MetricCard elevation={0}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  backgroundColor: '#e8f5e9',
                  borderRadius: '50%',
                  p: 1.5,
                  mr: 2
                }}
              >
                <ArrowUpwardIcon fontSize="small" />
              </Box>
              <Box>
                <Typography color="textSecondary" variant="subtitle2">
                  Requests This Minute
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h4" sx={{ mr: 1 }}>
                    {minuteMetrics.requestsCurrentMinute}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor:
                        minuteMetrics.increasePercentage >= 0
                          ? '#e6f4ea'
                          : '#fce8e6',
                      borderRadius: '4px',
                      px: 1,
                      py: 0.5
                    }}
                  >
                    <ArrowUpwardIcon
                      fontSize="small"
                      sx={{
                        color:
                          minuteMetrics.increasePercentage >= 0
                            ? '#34a853'
                            : '#ea4335',
                        mr: 0.5
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color:
                          minuteMetrics.increasePercentage >= 0
                            ? '#34a853'
                            : '#ea4335',
                        fontWeight: 500
                      }}
                    >
                      {Math.abs(minuteMetrics.increasePercentage)}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </MetricCard>
        </Grid>

        {/* Global Request Counter */}
        <Grid item xs={12} md={3}>
          <MetricCard elevation={0}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  backgroundColor: '#e8f5e9',
                  borderRadius: '50%',
                  p: 1.5,
                  mr: 2
                }}
              >
                <ComputerIcon />
              </Box>
              <Box>
                <Typography color="textSecondary" variant="subtitle2">
                  Request Counter
                </Typography>
                <Typography variant="h4">{requestCount}</Typography>
              </Box>
            </Box>
          </MetricCard>
        </Grid>

        {/* Rejected Requests This Minute */}
        <Grid item xs={12} md={3}>
          <MetricCard elevation={0}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  backgroundColor: '#fce8e6',
                  borderRadius: '50%',
                  p: 1.5,
                  mr: 2
                }}
              >
                <ErrorOutlineIcon fontSize="small" />
              </Box>
              <Box>
                <Typography color="textSecondary" variant="subtitle2">
                  Rejected This Minute
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h4" sx={{ mr: 1 }}>
                    {minuteMetrics.rejectedCurrentMinute}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor:
                        minuteMetrics.rejectedIncreasePercentage >= 0
                          ? '#fce8e6'
                          : '#e6f4ea',
                      borderRadius: '4px',
                      px: 1,
                      py: 0.5
                    }}
                  >
                    <ArrowUpwardIcon
                      fontSize="small"
                      sx={{
                        color:
                          minuteMetrics.rejectedIncreasePercentage >= 0
                            ? '#ea4335'
                            : '#34a853',
                        mr: 0.5,
                        transform:
                          minuteMetrics.rejectedIncreasePercentage >= 0
                            ? 'none'
                            : 'rotate(180deg)'
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color:
                          minuteMetrics.rejectedIncreasePercentage >= 0
                            ? '#ea4335'
                            : '#34a853',
                        fontWeight: 500
                      }}
                    >
                      {Math.abs(
                        minuteMetrics.rejectedIncreasePercentage
                      )}
                      %
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </MetricCard>
        </Grid>
      </Grid>

      {/* Routes Table */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 2
          }}
        >
          <Typography variant="h6">All Routes</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              placeholder="Search"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              sx={{ mr: 2, width: 200 }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ mr: 1 }}>
                Sort by:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {sortBy === 'newest' ? 'Newest' : 'Oldest'} ▼
              </Typography>
            </Box>
          </Box>
        </Box>

        <TableContainer component={Paper} elevation={0} sx={{ mb: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Predicate</TableCell>
                <TableCell>URI</TableCell>
                <TableCell>WithTokenFilter</TableCell>
                <TableCell>WithRateLimitFilter</TableCell>
                <TableCell>WithIpFilter</TableCell>
                <TableCell>IP Addresses</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentItems.map((route) => (
                <TableRow key={route.id}>
                  <TableCell>{route.id}</TableCell>
                  <TableCell>{route.predicates}</TableCell>
                  <TableCell>{route.uri}</TableCell>
                  <TableCell>{route.withToken ? 'True' : 'False'}</TableCell>
                  <TableCell>
                    {route.withRateLimit ? 'True' : 'False'}
                  </TableCell>
                  <TableCell>
                    {route.withIpFilter ? 'True' : 'False'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="info"
                      size="small"
                      sx={{ textTransform: 'none' }}
                      onClick={() => handleViewIps(route)}
                    >
                      View IPs
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      sx={{ mr: 1, textTransform: 'none' }}
                      onClick={() => handleOpenUpdateModal(route)}
                    >
                      Update
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      sx={{ textTransform: 'none' }}
                      onClick={() => handleDeleteRoute(route.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography variant="body2">
            Showing data {startIndex + 1} to{' '}
            {startIndex + currentItems.length} of {sortedRoutes.length}{' '}
            entries
          </Typography>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handleChangePage}
            color="primary"
          />
        </Box>
      </Box>

      {/* Add New Route Modal */}
      <Dialog open={openAddModal} onClose={handleCloseAddModal}>
        <DialogTitle>Add New Route</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
        >
          <TextField
            label="Predicate"
            name="predicates"
            value={newRoute.predicates}
            onChange={handleNewRouteChange}
            fullWidth
          />
          <TextField
            label="URI"
            name="uri"
            value={newRoute.uri}
            onChange={handleNewRouteChange}
            fullWidth
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Select
              name="withToken"
              value={newRoute.withToken.toString()}
              onChange={handleNewRouteChange}
              fullWidth
            >
              <MenuItem value="true">True</MenuItem>
              <MenuItem value="false">False</MenuItem>
            </Select>
            <Select
              name="withRateLimit"
              value={newRoute.withRateLimit.toString()}
              onChange={handleNewRouteChange}
              fullWidth
            >
              <MenuItem value="true">True</MenuItem>
              <MenuItem value="false">False</MenuItem>
            </Select>
            <Select
              name="withIpFilter"
              value={newRoute.withIpFilter.toString()}
              onChange={handleNewRouteChange}
              fullWidth
            >
              <MenuItem value="true">True</MenuItem>
              <MenuItem value="false">False</MenuItem>
            </Select>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddModal} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitAddRoute}
            variant="contained"
            sx={{ textTransform: 'none' }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Route Modal */}
      <Dialog open={openUpdateModal} onClose={handleCloseUpdateModal}>
        <DialogTitle>Update Route</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
        >
          {routeToUpdate && (
            <>
              <TextField
                label="Predicate"
                name="predicates"
                value={routeToUpdate.predicates}
                onChange={handleUpdateRouteChange}
                fullWidth
              />
              <TextField
                label="URI"
                name="uri"
                value={routeToUpdate.uri}
                onChange={handleUpdateRouteChange}
                fullWidth
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Select
                  name="withToken"
                  value={routeToUpdate.withToken.toString()}
                  onChange={handleUpdateRouteChange}
                  fullWidth
                >
                  <MenuItem value="true">True</MenuItem>
                  <MenuItem value="false">False</MenuItem>
                </Select>
                <Select
                  name="withRateLimit"
                  value={routeToUpdate.withRateLimit.toString()}
                  onChange={handleUpdateRouteChange}
                  fullWidth
                >
                  <MenuItem value="true">True</MenuItem>
                  <MenuItem value="false">False</MenuItem>
                </Select>
                <Select
                  name="withIpFilter"
                  value={routeToUpdate.withIpFilter.toString()}
                  onChange={handleUpdateRouteChange}
                  fullWidth
                >
                  <MenuItem value="true">True</MenuItem>
                  <MenuItem value="false">False</MenuItem>
                </Select>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseUpdateModal}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitUpdateRoute}
            variant="contained"
            sx={{ textTransform: 'none' }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* View IP Addresses Modal */}
      <Dialog open={openIpsModal} onClose={handleCloseIpsModal}>
        <DialogTitle>IP Addresses</DialogTitle>
        <DialogContent>
          {ipsToShow.length > 0 ? (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>IP Address</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ipsToShow.map((ip) => (
                    <TableRow key={ip.id}>
                      <TableCell>{ip.id}</TableCell>
                      <TableCell>{ip.ip}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>No IP addresses found for this route.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseIpsModal} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardPage;