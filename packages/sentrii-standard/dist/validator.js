"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateManifest = validateManifest;
const schema_1 = require("./schema");
function validateManifest(data) {
    const result = schema_1.SentriiManifestSchema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    else {
        return { success: false, error: result.error.message };
    }
}
