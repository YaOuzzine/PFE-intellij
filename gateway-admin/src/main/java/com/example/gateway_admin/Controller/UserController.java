package com.example.gateway_admin.Controller;

import com.example.gateway_admin.DTO.UserDTO;
import com.example.gateway_admin.Services.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Get current user profile
     */
    @GetMapping("/profile")
    public ResponseEntity<UserDTO> getCurrentUserProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        UserDTO userDTO = userService.getUserByUsername(username);
        return ResponseEntity.ok(userDTO);
    }

    /**
     * Update user profile
     */
    @PutMapping("/profile")
    public ResponseEntity<UserDTO> updateProfile(@Valid @RequestBody UserDTO userDTO) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        UserDTO updatedUser = userService.updateUserProfile(username, userDTO);
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * Update password
     */
    @PutMapping("/password")
    public ResponseEntity<?> updatePassword(@RequestBody PasswordChangeRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        try {
            userService.updatePassword(username, request.getCurrentPassword(), request.getNewPassword());
            Map<String, String> response = new HashMap<>();
            response.put("message", "Password updated successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    /**
     * Update security settings
     */
    @PutMapping("/security")
    public ResponseEntity<UserDTO> updateSecuritySettings(@RequestBody SecuritySettingsRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        UserDTO updatedUser = userService.updateSecuritySettings(
                username,
                request.getTwoFactorEnabled(),
                request.getSessionTimeoutMinutes(),
                request.getNotificationsEnabled()
        );

        return ResponseEntity.ok(updatedUser);
    }

    /**
     * Upload profile picture
     */
    @PostMapping("/avatar")
    public ResponseEntity<?> uploadProfilePicture(@RequestParam("file") MultipartFile file) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        try {
            // In a real app, this would handle file upload to a storage service
            // For demonstration, we'll just use a placeholder URL
            String profileImageUrl = "/api/images/profile/" + username + ".jpg";

            UserDTO updatedUser = userService.updateProfileImage(username, profileImageUrl);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload profile picture: " + e.getMessage());
        }
    }

    /**
     * DTO for password change request
     */
    public static class PasswordChangeRequest {
        private String currentPassword;
        private String newPassword;

        public String getCurrentPassword() {
            return currentPassword;
        }

        public void setCurrentPassword(String currentPassword) {
            this.currentPassword = currentPassword;
        }

        public String getNewPassword() {
            return newPassword;
        }

        public void setNewPassword(String newPassword) {
            this.newPassword = newPassword;
        }
    }

    /**
     * DTO for security settings request
     */
    public static class SecuritySettingsRequest {
        private Boolean twoFactorEnabled;
        private Integer sessionTimeoutMinutes;
        private Boolean notificationsEnabled;

        public Boolean getTwoFactorEnabled() {
            return twoFactorEnabled;
        }

        public void setTwoFactorEnabled(Boolean twoFactorEnabled) {
            this.twoFactorEnabled = twoFactorEnabled;
        }

        public Integer getSessionTimeoutMinutes() {
            return sessionTimeoutMinutes;
        }

        public void setSessionTimeoutMinutes(Integer sessionTimeoutMinutes) {
            this.sessionTimeoutMinutes = sessionTimeoutMinutes;
        }

        public Boolean getNotificationsEnabled() {
            return notificationsEnabled;
        }

        public void setNotificationsEnabled(Boolean notificationsEnabled) {
            this.notificationsEnabled = notificationsEnabled;
        }
    }
}