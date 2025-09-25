import Ajv, { type ValidateFunction } from 'ajv';

import { modelSchema, type Model } from '@rsc-xray/schemas';

const ajv = new Ajv({ allErrors: true, strict: false });
ajv.addFormat('date-time', {
  type: 'string',
  validate: (value: string) => !Number.isNaN(Date.parse(value)),
});

let validator: ValidateFunction<Model> | undefined;

function getValidator(): ValidateFunction<Model> {
  if (!validator) {
    validator = ajv.compile<Model>(modelSchema);
  }
  return validator;
}

export function ensureValidModel(model: Model): void {
  const validate = getValidator();
  if (!validate(model)) {
    const message = validate.errors?.length
      ? ajv.errorsText(validate.errors, { dataVar: 'model' })
      : 'Unknown validation error';
    throw new Error(`Model schema validation failed: ${message}`);
  }
}
