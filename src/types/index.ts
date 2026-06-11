export interface Vehicle {
    vin: string;
    brand: string;
    model: string;
    year: number;
    paired_at: string;
}

export interface Device {
    device_token: string;
    device_id: number | null;
    vin: string | null;
    brand: string | null;
    model: string | null;
    year: number | null;
    status: 'manufactured' | 'registered' | 'paired' | 'failed' | string;
    created_at: string;
    vehicles: Vehicle[];
}

export interface Stats {
    total: number;
    manufactured: number;
    registered: number;
    paired: number;
    [key: string]: number;
}
