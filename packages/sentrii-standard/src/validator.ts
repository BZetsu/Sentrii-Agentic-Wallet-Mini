import { SentriiManifestSchema, SentriiManifest } from './schema';

export function validateManifest(data: unknown): { success: true; data: SentriiManifest } | { success: false; error: string } {
  const result = SentriiManifestSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error.message };
  }
}
