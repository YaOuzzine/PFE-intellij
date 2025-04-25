package com.example.gateway_admin.Services;

import com.example.gateway_admin.DTO.UserDTO;
import com.example.gateway_admin.Entities.User;
import com.example.gateway_admin.Repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Get user by username
     */
    public UserDTO getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found with username: " + username));
        return convertToDTO(user);
    }

    /**
     * Create a new user
     */
    @Transactional
    public UserDTO createUser(User user) {
        // Check if username or email already exists
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        // Encrypt password
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Save user
        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    /**
     * Update user profile
     */
    @Transactional
    public UserDTO updateUserProfile(String username, UserDTO userDTO) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found with username: " + username));

        // Update fields
        user.setFirstName(userDTO.getFirstName());
        user.setLastName(userDTO.getLastName());
        user.setEmail(userDTO.getEmail());
        user.setJobTitle(userDTO.getJobTitle());
        user.setDepartment(userDTO.getDepartment());

        // Save user
        User updatedUser = userRepository.save(user);
        return convertToDTO(updatedUser);
    }

    /**
     * Update user password
     */
    @Transactional
    public void updatePassword(String username, String currentPassword, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found with username: " + username));

        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    /**
     * Update security settings
     */
    @Transactional
    public UserDTO updateSecuritySettings(String username, Boolean twoFactorEnabled,
                                          Integer sessionTimeoutMinutes, Boolean notificationsEnabled) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found with username: " + username));

        user.setTwoFactorEnabled(twoFactorEnabled);
        user.setSessionTimeoutMinutes(sessionTimeoutMinutes);
        user.setNotificationsEnabled(notificationsEnabled);

        User updatedUser = userRepository.save(user);
        return convertToDTO(updatedUser);
    }

    /**
     * Update profile image URL
     */
    @Transactional
    public UserDTO updateProfileImage(String username, String profileImageUrl) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found with username: " + username));

        user.setProfileImageUrl(profileImageUrl);
        User updatedUser = userRepository.save(user);
        return convertToDTO(updatedUser);
    }

    /**
     * Record user login
     */
    @Transactional
    public void recordUserLogin(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setLastLoginAt(LocalDateTime.now());
            userRepository.save(user);
        });
    }

    /**
     * Convert User entity to UserDTO
     */
    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setJobTitle(user.getJobTitle());
        dto.setDepartment(user.getDepartment());
        dto.setProfileImageUrl(user.getProfileImageUrl());
        dto.setTwoFactorEnabled(user.getTwoFactorEnabled());
        dto.setSessionTimeoutMinutes(user.getSessionTimeoutMinutes());
        dto.setNotificationsEnabled(user.getNotificationsEnabled());
        dto.setRole(user.getRole());
        return dto;
    }
}