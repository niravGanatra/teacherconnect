import api from './api';

export const acadOpportunitiesAPI = {
    // PUBLIC / EDUCATOR
    getOpportunities: (params) => api.get('/acadopportunities/', { params }),
    getOpportunity: (id) => api.get(`/acadopportunities/${id}/`),
    applyOpportunity: (id, coverNote) => api.post(`/acadopportunities/${id}/apply/`, { cover_note: coverNote }),
    withdrawApplication: (id) => api.delete(`/acadopportunities/${id}/withdraw/`),
    getMyApplications: () => api.get('/acadopportunities/my-applications/'),

    // INSTITUTION ADMIN
    getInstitutionOpportunities: () => api.get('/acadopportunities/institution/'),
    createInstitutionOpportunity: (data) => api.post('/acadopportunities/institution/', data),
    getInstitutionOpportunity: (id) => api.get(`/acadopportunities/institution/${id}/`),
    updateInstitutionOpportunity: (id, data) => api.put(`/acadopportunities/institution/${id}/`, data),
    closeInstitutionOpportunity: (id) => api.patch(`/acadopportunities/institution/${id}/close/`),
    
    getOpportunityApplications: (id) => api.get(`/acadopportunities/institution/${id}/applications/`),
    updateApplicationStatus: (appId, status) => api.patch(`/acadopportunities/applications/${appId}/status/`, { status }),
};
