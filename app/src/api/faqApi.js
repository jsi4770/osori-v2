import api from "./axios";

export const faqApi = {
    faqList:async()=>{
        const response = await api.get('/faq/questionList');
        return response.data;
    },
    addNewQuestion:async(question) =>{
        const response = await api.post('/faq/addNewQuestion', question, {
            headers: {
                'Content-Type': 'text/plain'
            }
        });
        return response.data;
    }
    
};