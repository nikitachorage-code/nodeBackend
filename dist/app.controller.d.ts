import { AppService } from './app.service.js';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHealth(): Promise<{
        status: string;
        database: string;
        timestamp: string;
    }>;
}
