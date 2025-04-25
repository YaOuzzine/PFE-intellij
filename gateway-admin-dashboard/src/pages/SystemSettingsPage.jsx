// src/pages/SystemSettingsPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Button, 
  TextField, 
  Grid, 
  Avatar,
  Tab, 
  Tabs, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import apiClient from '../apiClient';

// Custom tab panel component for settings sections
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SystemSettingsPage = () => {
  const navigate = useNavigate();
  const { logout, user, updateUserProfile } = useContext(AuthContext);
  
  // State management
  const [topTab, setTopTab] = useState('GENERAL');
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    jobTitle: user?.jobTitle || '',
    department: user?.department || ''
  });
  
  // Password change form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Profile picture state
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [openPictureDialog, setOpenPictureDialog] = useState(false);
  
  // Error states for form validation
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: user?.twoFactorEnabled || false,
    sessionTimeout: user?.sessionTimeout || 30,
    notificationsEnabled: user?.notificationsEnabled || true
  });

  // User management state
  const [users, setUsers] = useState([]);
  const [openAddUserDialog, setOpenAddUserDialog] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'User'
  });
  const [newUserErrors, setNewUserErrors] = useState({});

  // Load user data
  useEffect(() => {
    // In a real implementation, you would fetch this from your API
    // This is a placeholder for demonstration purposes
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        // In a real app, you would fetch user data:
        // const response = await apiClient.get('/api/user/profile');
        // const userData = response.data;
        
        // Simulating data load delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // For demo purposes, use hardcoded sample data
        const sampleUserData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          jobTitle: 'System Administrator',
          department: 'IT Operations',
          twoFactorEnabled: false,
          sessionTimeout: 30,
          notificationsEnabled: true
        };
        
        setProfileData(sampleUserData);
        setSecuritySettings({
          twoFactorEnabled: sampleUserData.twoFactorEnabled,
          sessionTimeout: sampleUserData.sessionTimeout,
          notificationsEnabled: sampleUserData.notificationsEnabled
        });

        // Sample users data
        setUsers([
          {
            id: 5,
            username: 'admin',
            role: 'Administrator',
            status: 'Active'
          },
          {
            id: 6,
            username: 'user',
            role: 'User',
            status: 'Active'
          },
          {
            id: 8,
            username: 'admin2',
            role: 'Administrator',
            status: 'Active'
          },
          {
            id: 9,
            username: 'Yassine',
            role: 'User',
            status: 'Active'
          },
          {
            id: 7,
            username: 'Mimi',
            role: 'User',
            status: 'Disabled'
          }
        ]);
      } catch (error) {
        showNotification('Error loading user profile', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    loadUserProfile();
  }, []);

  // Handlers
  const handleTopTabChange = (tab) => {
    setTopTab(tab);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for field when typing
    if (profileErrors[name]) {
      setProfileErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for field when typing
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSecurityChange = (e) => {
    const { name, value, checked } = e.target;
    setSecuritySettings(prev => ({
      ...prev,
      [name]: e.target.type === 'checkbox' ? checked : value
    }));
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUserData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for field when typing
    if (newUserErrors[name]) {
      setNewUserErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Form submission handlers
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    // Validation
    const errors = {};
    if (!profileData.firstName.trim()) errors.firstName = 'First name is required';
    if (!profileData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!profileData.email.trim()) errors.email = 'Email is required';
    if (profileData.email && !profileData.email.includes('@')) errors.email = 'Valid email is required';
    
    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }
    
    // Submit form
    try {
      setLoading(true);
      
      // In a real app, you would update the profile:
      // await apiClient.put('/api/user/profile', profileData);
      
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update context
      if (updateUserProfile) {
        updateUserProfile(profileData);
      }
      
      showNotification('Profile updated successfully');
    } catch (error) {
      showNotification('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    // Validation
    const errors = {};
    if (!passwordData.currentPassword) errors.currentPassword = 'Current password is required';
    if (!passwordData.newPassword) errors.newPassword = 'New password is required';
    if (!passwordData.confirmPassword) errors.confirmPassword = 'Please confirm your password';
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (passwordData.newPassword && passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    
    // Submit form
    try {
      setLoading(true);
      
      // In a real app, you would update the password:
      // await apiClient.put('/api/user/password', {
      //   currentPassword: passwordData.currentPassword,
      //   newPassword: passwordData.newPassword
      // });
      
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      showNotification('Password updated successfully');
    } catch (error) {
      showNotification('Failed to update password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSecurity = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // In a real app, you would update security settings:
      // await apiClient.put('/api/user/security', securitySettings);
      
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      showNotification('Security settings updated successfully');
    } catch (error) {
      showNotification('Failed to update security settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    // Validation
    const errors = {};
    if (!newUserData.username.trim()) errors.username = 'Username is required';
    if (!newUserData.firstName.trim()) errors.firstName = 'First name is required';
    if (!newUserData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!newUserData.email.trim()) errors.email = 'Email is required';
    if (newUserData.email && !newUserData.email.includes('@')) errors.email = 'Valid email is required';
    if (!newUserData.password.trim()) errors.password = 'Password is required';
    if (newUserData.password && newUserData.password.length < 8) errors.password = 'Password must be at least 8 characters';
    
    if (Object.keys(errors).length > 0) {
      setNewUserErrors(errors);
      return;
    }
    
    try {
      setLoading(true);
      
      // In a real app, you would create a new user:
      // await apiClient.post('/api/users', newUserData);
      
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Add the new user to the list with a generated ID
      const newUser = {
        id: Math.max(...users.map(u => u.id)) + 1,
        username: newUserData.username,
        role: newUserData.role,
        status: 'Active'
      };
      
      setUsers(prev => [...prev, newUser]);
      
      // Reset form and close dialog
      setNewUserData({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'User'
      });
      setOpenAddUserDialog(false);
      
      showNotification('User created successfully');
    } catch (error) {
      showNotification('Failed to create user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === 5) {
      showNotification('Cannot delete the primary admin user', 'error');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // In a real app, you would delete the user:
      // await apiClient.delete(`/api/users/${userId}`);
      
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Remove the user from the list
      setUsers(prev => prev.filter(user => user.id !== userId));
      
      showNotification('User deleted successfully');
    } catch (error) {
      showNotification('Failed to delete user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserStatus = async (userId, currentStatus) => {
    if (userId === 5) {
      showNotification('Cannot modify the primary admin user', 'error');
      return;
    }
    
    const newStatus = currentStatus === 'Active' ? 'Disabled' : 'Active';
    
    try {
      setLoading(true);
      
      // In a real app, you would update the user status:
      // await apiClient.patch(`/api/users/${userId}`, { status: newStatus });
      
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update the user status in the list
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
      
      showNotification(`User ${newStatus === 'Active' ? 'activated' : 'disabled'} successfully`);
    } catch (error) {
      showNotification('Failed to update user status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPicture = () => {
    // In a real app, you would implement file upload
    setOpenPictureDialog(false);
    showNotification('Profile picture updated');
  };

  // Get user initials for avatar
  const getInitials = () => {
    return `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
        System Settings
      </Typography>

      {/* Top level tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Box sx={{ display: 'flex' }}>
          <Box 
            sx={{ 
              p: 2, 
              cursor: 'pointer',
              borderBottom: topTab === 'GENERAL' ? 2 : 0,
              borderColor: topTab === 'GENERAL' ? 'primary.main' : 'transparent',
              color: topTab === 'GENERAL' ? 'primary.main' : 'text.primary',
              fontWeight: topTab === 'GENERAL' ? 'bold' : 'normal'
            }}
            onClick={() => handleTopTabChange('GENERAL')}
          >
            GENERAL
          </Box>
          <Box 
            sx={{ 
              p: 2, 
              cursor: 'pointer',
              borderBottom: topTab === 'USER_MANAGEMENT' ? 2 : 0,
              borderColor: topTab === 'USER_MANAGEMENT' ? 'primary.main' : 'transparent',
              color: topTab === 'USER_MANAGEMENT' ? 'primary.main' : 'text.primary',
              fontWeight: topTab === 'USER_MANAGEMENT' ? 'bold' : 'normal'
            }}
            onClick={() => handleTopTabChange('USER_MANAGEMENT')}
          >
            USER MANAGEMENT
          </Box>
        </Box>
      </Box>

      {/* General Settings Content */}
      {topTab === 'GENERAL' && (
        <Paper sx={{ width: '100%', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab icon={<PersonIcon />} label="Profile" />
            <Tab icon={<LockIcon />} label="Password" />
            <Tab icon={<SecurityIcon />} label="Security" />
          </Tabs>
          
          {/* Profile tab */}
          <TabPanel value={activeTab} index={0}>
            <Box component="form" onSubmit={handleUpdateProfile}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Avatar 
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      fontSize: 48,
                      mb: 2,
                      bgcolor: profileImage ? 'transparent' : 'primary.main'
                    }}
                    src={profileImage}
                  >
                    {!profileImage && getInitials()}
                  </Avatar>
                  <Button 
                    variant="outlined" 
                    startIcon={<EditIcon />} 
                    onClick={() => setOpenPictureDialog(true)}
                  >
                    Change Picture
                  </Button>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="firstName"
                        label="First Name"
                        fullWidth
                        value={profileData.firstName}
                        onChange={handleProfileChange}
                        error={!!profileErrors.firstName}
                        helperText={profileErrors.firstName}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="lastName"
                        label="Last Name"
                        fullWidth
                        value={profileData.lastName}
                        onChange={handleProfileChange}
                        error={!!profileErrors.lastName}
                        helperText={profileErrors.lastName}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        name="email"
                        label="Email Address"
                        fullWidth
                        value={profileData.email}
                        onChange={handleProfileChange}
                        error={!!profileErrors.email}
                        helperText={profileErrors.email}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="jobTitle"
                        label="Job Title"
                        fullWidth
                        value={profileData.jobTitle}
                        onChange={handleProfileChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="department"
                        label="Department"
                        fullWidth
                        value={profileData.department}
                        onChange={handleProfileChange}
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Update Profile'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>
          
          {/* Password tab */}
          <TabPanel value={activeTab} index={1}>
            <Box component="form" onSubmit={handleUpdatePassword} sx={{ maxWidth: 500, mx: 'auto' }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    name="currentPassword"
                    label="Current Password"
                    type="password"
                    fullWidth
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    error={!!passwordErrors.currentPassword}
                    helperText={passwordErrors.currentPassword}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="newPassword"
                    label="New Password"
                    type="password"
                    fullWidth
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    error={!!passwordErrors.newPassword}
                    helperText={passwordErrors.newPassword}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="confirmPassword"
                    label="Confirm New Password"
                    type="password"
                    fullWidth
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    error={!!passwordErrors.confirmPassword}
                    helperText={passwordErrors.confirmPassword}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Update Password'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>
          
          {/* Security tab */}
          <TabPanel value={activeTab} index={2}>
            <Box component="form" onSubmit={handleUpdateSecurity} sx={{ maxWidth: 600, mx: 'auto' }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Security Settings
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography>Two-Factor Authentication</Typography>
                      <Button
                        variant={securitySettings.twoFactorEnabled ? "outlined" : "contained"}
                        color={securitySettings.twoFactorEnabled ? "error" : "success"}
                        onClick={() => setSecuritySettings(prev => ({
                          ...prev,
                          twoFactorEnabled: !prev.twoFactorEnabled
                        }))}
                      >
                        {securitySettings.twoFactorEnabled ? 'Disable' : 'Enable'}
                      </Button>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography>Session Timeout (minutes)</Typography>
                      <TextField
                        name="sessionTimeout"
                        type="number"
                        value={securitySettings.sessionTimeout}
                        onChange={handleSecurityChange}
                        InputProps={{ inputProps: { min: 5, max: 120 } }}
                        sx={{ width: 100 }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography>Email Notifications</Typography>
                      <Button
                        variant={securitySettings.notificationsEnabled ? "outlined" : "contained"}
                        color={securitySettings.notificationsEnabled ? "error" : "success"}
                        onClick={() => setSecuritySettings(prev => ({
                          ...prev,
                          notificationsEnabled: !prev.notificationsEnabled
                        }))}
                      >
                        {securitySettings.notificationsEnabled ? 'Disable' : 'Enable'}
                      </Button>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Save Security Settings'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>
        </Paper>
      )}

      {/* User Management Content */}
      {topTab === 'USER_MANAGEMENT' && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Manage User Accounts
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => setOpenAddUserDialog(true)}
            >
              Add New User
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.status} 
                        color={user.status === 'Active' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        sx={{ minWidth: 'auto', p: 1, mr: 1 }}
                        color="primary"
                        onClick={() => handleUpdateUserStatus(user.id, user.status)}
                      >
                        <EditIcon fontSize="small" />
                      </Button>
                      <Button
                        sx={{ minWidth: 'auto', p: 1 }}
                        color="error"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Logout section */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Account Management
        </Typography>
        <Typography sx={{ mb: 2 }}>
          You can log out of your account by clicking the button below. This will immediately end your current session.
        </Typography>

        <Button
          variant="contained"
          sx={{
            backgroundColor: 'error.main',
            '&:hover': { backgroundColor: 'error.dark' },
            color: 'white',
            fontWeight: 'bold',
            mt: 2
          }}
          onClick={handleLogout}
        >
          LOG OUT
        </Button>
      </Paper>

      {/* Profile picture dialog */}
      <Dialog open={openPictureDialog} onClose={() => setOpenPictureDialog(false)}>
        <DialogTitle>Update Profile Picture</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Upload a new profile picture. The image should be at least 200x200 pixels.
          </Typography>
          <Button
            variant="contained"
            component="label"
            sx={{ mt: 2 }}
          >
            Select Image
            <input
              type="file"
              hidden
              accept="image/*"
            />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPictureDialog(false)}>Cancel</Button>
          <Button onClick={handleUploadPicture} variant="contained" color="primary">Upload</Button>
        </DialogActions>
      </Dialog>

      {/* Add user dialog */}
      <Dialog 
        open={openAddUserDialog} 
        onClose={() => setOpenAddUserDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="username"
                  label="Username"
                  fullWidth
                  value={newUserData.username}
                  onChange={handleNewUserChange}
                  error={!!newUserErrors.username}
                  helperText={newUserErrors.username}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="firstName"
                  label="First Name"
                  fullWidth
                  value={newUserData.firstName}
                  onChange={handleNewUserChange}
                  error={!!newUserErrors.firstName}
                  helperText={newUserErrors.firstName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="lastName"
                  label="Last Name"
                  fullWidth
                  value={newUserData.lastName}
                  onChange={handleNewUserChange}
                  error={!!newUserErrors.lastName}
                  helperText={newUserErrors.lastName}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="email"
                  label="Email Address"
                  fullWidth
                  value={newUserData.email}
                  onChange={handleNewUserChange}
                  error={!!newUserErrors.email}
                  helperText={newUserErrors.email}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="password"
                  label="Password"
                  type="password"
                  fullWidth
                  value={newUserData.password}
                  onChange={handleNewUserChange}
                  error={!!newUserErrors.password}
                  helperText={newUserErrors.password}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="role"
                  label="Role"
                  select
                  fullWidth
                  value={newUserData.role}
                  onChange={handleNewUserChange}
                  SelectProps={{
                    native: true
                  }}
                >
                  <option value="User">User</option>
                  <option value="Administrator">Administrator</option>
                </TextField>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddUserDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddUser} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification snackbar */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={5000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

  export default SystemSettingsPage; 