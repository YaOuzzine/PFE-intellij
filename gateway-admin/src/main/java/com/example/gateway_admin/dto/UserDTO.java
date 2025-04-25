package com.example.gateway_admin.DTO;

import lombok.Data;

/**
 * Data Transfer Object for User entities.
 * Used to transfer user data between the frontend and backend
 * without exposing sensitive information.
 */
@Data
public class UserDTO {
    private Long id;
    private String username;
    private String firstName;
    private String lastName;
    private String email;
    private String jobTitle;
    private String department;
    private String profileImageUrl;
    private Boolean twoFactorEnabled;
    private Integer sessionTimeoutMinutes;
    private Boolean notificationsEnabled;
    private String role;

    // Exclude sensitive fields like password, creation dates, etc.
}