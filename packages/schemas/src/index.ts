import schema from './model.schema.json' assert { type: 'json' };

export * from './types.js';

export const modelSchema = schema;
export type ModelSchema = typeof schema;
