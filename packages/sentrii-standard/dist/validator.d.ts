import { SentriiManifest } from './schema';
export declare function validateManifest(data: unknown): {
    success: true;
    data: SentriiManifest;
} | {
    success: false;
    error: string;
};
