import api from './api';

/**
 * Service for user profile and resume management.
 */
export const userService = {
  /**
   * Fetch current user's profile
   */
  getProfile: async () => {
    return await api.get('/users/profile');
  },

  /**
   * Update current user's profile details
   * @param {Object} profileData
   */
  updateProfile: async (profileData) => {
    return await api.put('/users/profile', profileData);
  },

  /**
   * Upload or replace student resume (multipart/form-data with 'resume' field)
   * @param {FormData} formData
   */
  uploadResume: async (formData) => {
    return await api.post('/users/resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Download / fetch student resume as Blob
   */
  getResume: async () => {
    return await api.get('/users/resume', {
      responseType: 'blob',
    });
  },

  /**
   * Delete student's uploaded resume
   */
  deleteResume: async () => {
    return await api.delete('/users/resume');
  },
};

export default userService;
