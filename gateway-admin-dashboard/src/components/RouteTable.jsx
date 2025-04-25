// src/components/RouteTable.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// Example of a single route object shape:
// {
//   id: 1,
//   withRateFilter: true,
//   withTokenFilter: false,
//   withRouteLimitFilter: true,
//   predicates: '["Path=/somepath"]',
//   uri: 'http://localhost:8080',
// }

export default function RouteTable({ fetchRoutes, onDelete, onUpdate }) {
  // The parent can pass fetchRoutes (a function to load data),
  // onDelete (a function to delete a route), etc.

  const [routes, setRoutes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Adjust to control how many rows per page

  useEffect(() => {
    // Load data when component mounts
    const loadData = async () => {
      try {
        const data = await fetchRoutes();
        setRoutes(data);
      } catch (error) {
        console.error('Error fetching routes:', error);
      }
    };
    loadData();
  }, [fetchRoutes]);

  // Filter the routes by the search term (case-insensitive)
  const filteredRoutes = routes.filter((route) => {
    // Convert route data to string so we can do a simple includes() check
    const routeString = JSON.stringify(route).toLowerCase();
    return routeString.includes(searchTerm.toLowerCase());
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRoutes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredRoutes.slice(startIndex, endIndex);

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to page 1 on new search
  };

  return (
    <Box>
      {/* Header row: Title and Search */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          All Routes
        </Typography>

        {/* Search Field */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            size="small"
            variant="outlined"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ mr: 1 }}
          />
          <IconButton color="primary">
            <SearchIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><strong>WithRateFilter</strong></TableCell>
              <TableCell><strong>WithTokenFilter</strong></TableCell>
              <TableCell><strong>WithRouteLimitFilter</strong></TableCell>
              <TableCell><strong>Predicates</strong></TableCell>
              <TableCell><strong>URI</strong></TableCell>
              <TableCell align="center"><strong>Action</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentItems.map((route) => (
              <TableRow key={route.id}>
                <TableCell>{route.withRateFilter ? 'True' : 'False'}</TableCell>
                <TableCell>{route.withTokenFilter ? 'True' : 'False'}</TableCell>
                <TableCell>{route.withRouteLimitFilter ? 'True' : 'False'}</TableCell>
                <TableCell>{route.predicates}</TableCell>
                <TableCell>{route.uri}</TableCell>
                <TableCell align="center">
                  {/* Update Button */}
                  <Button
                    variant="outlined"
                    color="info"
                    size="small"
                    startIcon={<EditIcon />}
                    sx={{ mr: 1 }}
                    onClick={() => onUpdate(route.id)}
                  >
                    Update
                  </Button>
                  {/* Delete Button */}
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={() => onDelete(route.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {currentItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No routes found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>
    </Box>
  );
}
