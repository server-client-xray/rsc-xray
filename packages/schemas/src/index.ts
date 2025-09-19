import schema from './model.schema.json';

export * from './types';

export const modelSchema = schema;
export type ModelSchema = typeof schema;
