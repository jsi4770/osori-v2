import api from "./axios";

export const coachingApi = {

    requestNudge: async ({ userId, category, originalAmount, avgAmount }) => {
        const response = await api.post('/coaching/nudge', {
            userId, category, originalAmount, avgAmount
        });
        return response.data;
    },

    requestCompositeNudge: async ({ userId, anomalies }) => {
        const response = await api.post('/coaching/nudge/composite', {
            userId, anomalies
        });
        return response.data;
    },

    sendChatMessage: async ({ threadId, userId, message }) => {
        const response = await api.post('/coaching/chat', {
            threadId, userId, message
        });
        return response.data;
    },

    getGrowthReport: async (userId) => {
        const response = await api.get(`/coaching/report/${userId}`);
        return response.data;
    },

    respondToNudge: async (messageId, accepted) => {
        const response = await api.post(`/coaching/nudge/${messageId}/respond`, {
            accepted
        });
        return response.data;
    },

    getSpendingTrend: async ({ userId, yearMonth, monthlyTotals }) => {
        const response = await api.post('/coaching/trend', {
            userId, yearMonth, monthlyTotals
        });
        return response.data;
    },
};

export const { requestNudge, requestCompositeNudge, sendChatMessage, getGrowthReport, respondToNudge, getSpendingTrend } = coachingApi;

export default coachingApi;
