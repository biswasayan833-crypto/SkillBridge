import api from './api';

/**
 * Service for Opportunity management and browsing.
 */
export const opportunityService = {
  /**
   * Get public active opportunities with search, filter, and pagination
   * @param {Object} params - { search, type, workMode, location, skills, page, limit, sort }
   */
  getOpportunities: async (params = {}) => {
    return await api.get('/opportunities', { params });
  },

  /**
   * Get single active opportunity by ID
   * @param {string} id - Opportunity ObjectId
   */
  getOpportunityById: async (id) => {
    return await api.get(`/opportunities/${id}`);
  },

  /**
   * Get all opportunities posted by the authenticated recruiter
   */
  getMyOpportunities: async () => {
    return await api.get('/opportunities/my');
  },

  /**
   * Create a new opportunity (Recruiter/Admin)
   * @param {Object} data - Opportunity details
   */
  createOpportunity: async (data) => {
    return await api.post('/opportunities', data);
  },

  /**
   * Update an existing opportunity (Recruiter/Admin owner)
   * @param {string} id - Opportunity ObjectId
   * @param {Object} data - Updated details
   */
  updateOpportunity: async (id, data) => {
    return await api.put(`/opportunities/${id}`, data);
  },

  /**
   * Soft-deactivate an opportunity (Recruiter/Admin owner)
   * @param {string} id - Opportunity ObjectId
   */
  deleteOpportunity: async (id) => {
    return await api.delete(`/opportunities/${id}`);
  },
};

export default opportunityService;
