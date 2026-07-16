import axios from 'axios';
const SERVICE_KEY = '13e6cd1d0b25da1156a89cbfeb3e2790e1542c562db6aa23a4760b6864fbfc22';

export const fetchHolidays = async (year, month) => {
    const cacheKey = `holidays-${year}-${month}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
        return JSON.parse(cachedData);
    }

    const solYear = year;
    const solMonth = String(month).padStart(2, '0');
    const url = `https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?serviceKey=${SERVICE_KEY}&solYear=${solYear}&solMonth=${solMonth}&_type=json`;

    try {
        const response = await axios.get(url);

        const items = response.data.response?.body?.items?.item;
        const holidayList = Array.isArray(items) ? items : items ? [items] : [];

        const result = holidayList.reduce((acc, holiday) => {
            const dateStr = String(holiday.locdate).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
            acc[dateStr] = holiday.dateName;
            return acc;
        }, {});

        if (Object.keys(result).length > 0) {
            localStorage.setItem(cacheKey, JSON.stringify(result));
        }

        return result;
    } catch (error) {
        console.error("공휴일 로드 실패:", error);
        return {};
    }
};