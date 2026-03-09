import { z } from 'zod';

export const ManifestFieldSchema = z.object({
  name: z.string(),
  description: z.string(),
  required: z.boolean().default(true),
});

export const ManifestWorkflowSchema = z.object({
  id: z.string(),
  description: z.string(),
  inputs: z.array(ManifestFieldSchema),
  labels: z.array(z.string()),
  aliases: z.array(z.string()).optional(),
  verificationCues: z.array(z.string()),
  docsLink: z.string().url().optional(),
  confirmationRequired: z.boolean().default(true),
});

export const SentriiManifestSchema = z.object({
  version: z.literal('1.0'),
  name: z.string(),
  baseUrl: z.string().url(),
  workflows: z.array(ManifestWorkflowSchema),
});

export type SentriiManifest = z.infer<typeof SentriiManifestSchema>;
export type ManifestWorkflow = z.infer<typeof ManifestWorkflowSchema>;
export type ManifestField = z.infer<typeof ManifestFieldSchema>;
