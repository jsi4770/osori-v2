import axios from "axios";

const api = axios.create({
    baseURL : import.meta.env.VITE_API_BASE_URL || '/fincoach',
    timeout : 10000,
    headers : {
        'Content-Type' : 'application/json'
    },
    withCredentials: true
});

// 저장된 JWT를 매 요청에 실어 보낸다.
// 세션 쿠키가 PWA 종료 시 사라져도 localStorage 토큰으로 인증이 유지되도록 함.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;