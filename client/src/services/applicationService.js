import api from './api';

/**
 * Service for Application submission, tracking, and recruiter pipeline management.
 */
export const applicationService = {
  /**
   * Submit an application to an active opportunity (Student)
   * @param {Object} data - { opportunity: string, coverLetter: string }
   */
  createApplication: async (data) => {
    return await api.post('/applications', data);
  },

  /**
   * Get all applications submitted by the authenticated student
   * @param {Object} params - { page, limit }
   */
  getMyApplications: async (params = {}) => {
    return await api.get('/applications/my', { params });
  },

  /**
   * Get a single application by ID (Student owner / Recruiter owner / Admin)
   * @param {string} id - Application ObjectId
   */
  getApplicationById: async (id) => {
    return await api.get(`/applications/${id}`);
  },

  /**
   * Get all candidate applications for a specific opportunity (Recruiter owner / Admin)
   * @param {string} opportunityId - Opportunity ObjectId
   * @param {Object} params - { page, limit }
   */
  getOpportunityApplications: async (opportunityId, params = {}) => {
    return await api.get(`/applications/opportunity/${opportunityId}`, { params });
  },

  /**
   * Update the candidate hiring stage/status (Recruiter owner / Admin)
   * @param {string} id - Application ObjectId
   * @param {string} status - One of: 'Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'
   */
  updateApplicationStatus: async (id, status) => {
    return await api.put(`/applications/${id}/status`, { status });
  },
};

export default applicationService;
