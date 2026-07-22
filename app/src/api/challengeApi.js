import api from "./axios";

export const challengeApi = {

    extractChallenge: async ({ threadId, userId }) => {
        const response = await api.post('/challenge/extract', { threadId, userId });
        return response.data;
    },

    createChallenge: async ({ userId, threadId, category, title, metricType, targetValue, periodDays }) => {
        const response = await api.post('/challenge', {
            userId, threadId, category, title, metricType, targetValue, periodDays
        });
        return response.data;
    },

    getChallenges: async (userId) => {
        const response = await api.get(`/challenge/${userId}`);
        return response.data;
    },

    deleteChallenge: async (challengeId, userId) => {
        const response = await api.delete(`/challenge/${challengeId}`, { params: { userId } });
        return response.data;
    },
};

export const { extractChallenge, createChallenge, getChallenges, deleteChallenge } = challengeApi;

export default challengeApi;
