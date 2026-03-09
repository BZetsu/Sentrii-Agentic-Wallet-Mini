import { z } from 'zod';
export declare const ManifestFieldSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    required: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    required: boolean;
}, {
    name: string;
    description: string;
    required?: boolean | undefined;
}>;
export declare const ManifestWorkflowSchema: z.ZodObject<{
    id: z.ZodString;
    description: z.ZodString;
    inputs: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        required: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
        required: boolean;
    }, {
        name: string;
        description: string;
        required?: boolean | undefined;
    }>, "many">;
    labels: z.ZodArray<z.ZodString, "many">;
    aliases: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    verificationCues: z.ZodArray<z.ZodString, "many">;
    docsLink: z.ZodOptional<z.ZodString>;
    confirmationRequired: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    description: string;
    id: string;
    inputs: {
        name: string;
        description: string;
        required: boolean;
    }[];
    labels: string[];
    verificationCues: string[];
    confirmationRequired: boolean;
    aliases?: string[] | undefined;
    docsLink?: string | undefined;
}, {
    description: string;
    id: string;
    inputs: {
        name: string;
        description: string;
        required?: boolean | undefined;
    }[];
    labels: string[];
    verificationCues: string[];
    aliases?: string[] | undefined;
    docsLink?: string | undefined;
    confirmationRequired?: boolean | undefined;
}>;
export declare const SentriiManifestSchema: z.ZodObject<{
    version: z.ZodLiteral<"1.0">;
    name: z.ZodString;
    baseUrl: z.ZodString;
    workflows: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        description: z.ZodString;
        inputs: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            required: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            description: string;
            required: boolean;
        }, {
            name: string;
            description: string;
            required?: boolean | undefined;
        }>, "many">;
        labels: z.ZodArray<z.ZodString, "many">;
        aliases: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        verificationCues: z.ZodArray<z.ZodString, "many">;
        docsLink: z.ZodOptional<z.ZodString>;
        confirmationRequired: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        id: string;
        inputs: {
            name: string;
            description: string;
            required: boolean;
        }[];
        labels: string[];
        verificationCues: string[];
        confirmationRequired: boolean;
        aliases?: string[] | undefined;
        docsLink?: string | undefined;
    }, {
        description: string;
        id: string;
        inputs: {
            name: string;
            description: string;
            required?: boolean | undefined;
        }[];
        labels: string[];
        verificationCues: string[];
        aliases?: string[] | undefined;
        docsLink?: string | undefined;
        confirmationRequired?: boolean | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    version: "1.0";
    baseUrl: string;
    workflows: {
        description: string;
        id: string;
        inputs: {
            name: string;
            description: string;
            required: boolean;
        }[];
        labels: string[];
        verificationCues: string[];
        confirmationRequired: boolean;
        aliases?: string[] | undefined;
        docsLink?: string | undefined;
    }[];
}, {
    name: string;
    version: "1.0";
    baseUrl: string;
    workflows: {
        description: string;
        id: string;
        inputs: {
            name: string;
            description: string;
            required?: boolean | undefined;
        }[];
        labels: string[];
        verificationCues: string[];
        aliases?: string[] | undefined;
        docsLink?: string | undefined;
        confirmationRequired?: boolean | undefined;
    }[];
}>;
export type SentriiManifest = z.infer<typeof SentriiManifestSchema>;
export type ManifestWorkflow = z.infer<typeof ManifestWorkflowSchema>;
export type ManifestField = z.infer<typeof ManifestFieldSchema>;
