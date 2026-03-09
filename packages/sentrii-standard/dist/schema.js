"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SentriiManifestSchema = exports.ManifestWorkflowSchema = exports.ManifestFieldSchema = void 0;
const zod_1 = require("zod");
exports.ManifestFieldSchema = zod_1.z.object({
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    required: zod_1.z.boolean().default(true),
});
exports.ManifestWorkflowSchema = zod_1.z.object({
    id: zod_1.z.string(),
    description: zod_1.z.string(),
    inputs: zod_1.z.array(exports.ManifestFieldSchema),
    labels: zod_1.z.array(zod_1.z.string()),
    aliases: zod_1.z.array(zod_1.z.string()).optional(),
    verificationCues: zod_1.z.array(zod_1.z.string()),
    docsLink: zod_1.z.string().url().optional(),
    confirmationRequired: zod_1.z.boolean().default(true),
});
exports.SentriiManifestSchema = zod_1.z.object({
    version: zod_1.z.literal('1.0'),
    name: zod_1.z.string(),
    baseUrl: zod_1.z.string().url(),
    workflows: zod_1.z.array(exports.ManifestWorkflowSchema),
});
