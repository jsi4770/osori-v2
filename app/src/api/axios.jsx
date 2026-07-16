import axios from "axios";

const api = axios.create({
    baseURL : '/fincoach',
    timeout : 10000,
    headers : {
        'Content-Type' : 'application/json'
    },
    withCredentials: true
});

export default api; 