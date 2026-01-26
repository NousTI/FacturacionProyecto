import axios from 'axios';
import { environment } from '../environments/environment';
import { setupInterceptors } from './interceptor';

export const http = axios.create({
    baseURL: environment.apiUrl,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

setupInterceptors(http);
