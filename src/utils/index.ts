/**
 * General purpose utils used by the frontend.
 */
import { t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { isPesa } from 'fyo/utils';
import { DuplicateEntryError, LinkValidationError } from 'fyo/utils/errors';
import { Money } from 'pesa';
import { Field, FieldType, FieldTypeEnum } from 'schemas/types';

export function stringifyCircular(
  obj: unknown,
  ignoreCircular: boolean = false,
  convertDocument: boolean = false
) {
  const cacheKey: string[] = [];
  const cacheValue: unknown[] = [];

  return JSON.stringify(obj, (key, value) => {
    if (typeof value !== 'object' || value === null) {
      cacheKey.push(key);
      cacheValue.push(value);
      return value;
    }

    if (cacheValue.includes(value)) {
      const circularKey = cacheKey[cacheValue.indexOf(value)] || '{self}';
      return ignoreCircular ? undefined : `[Circular:${circularKey}]`;
    }

    cacheKey.push(key);
    cacheValue.push(value);

    if (convertDocument && value instanceof Doc) {
      return value.getValidDict();
    }

    return value;
  });
}

export function fuzzyMatch(input: string, target: string) {
  const keywordLetters = [...input];
  const candidateLetters = [...target];

  let keywordLetter = keywordLetters.shift();
  let candidateLetter = candidateLetters.shift();

  let isMatch = true;
  let distance = 0;

  while (keywordLetter && candidateLetter) {
    if (keywordLetter === candidateLetter) {
      keywordLetter = keywordLetters.shift();
    } else if (keywordLetter.toLowerCase() === candidateLetter.toLowerCase()) {
      keywordLetter = keywordLetters.shift();
      distance += 0.5;
    } else {
      distance += 1;
    }

    candidateLetter = candidateLetters.shift();
  }

  if (keywordLetter !== undefined) {
    distance = Number.MAX_SAFE_INTEGER;
    isMatch = false;
  } else {
    distance += candidateLetters.length;
  }

  return { isMatch, distance };
}

export function convertPesaValuesToFloat(obj: Record<string, unknown>) {
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (!isPesa(value)) {
      return;
    }

    obj[key] = (value as Money).float;
  });
}

export function getErrorMessage(e: Error, doc?: Doc): string {
  let errorMessage = e.message || t`An error occurred.`;

  const { schemaName, name }: { schemaName?: string; name?: string } =
    doc ?? {};
  const canElaborate = !!(schemaName && name);

  if (e instanceof LinkValidationError && canElaborate) {
    errorMessage = t`${schemaName} ${name} is linked with existing records.`;
  } else if (e instanceof DuplicateEntryError && canElaborate) {
    errorMessage = t`${schemaName} ${name} already exists.`;
  }

  return errorMessage;
}

export function isNumeric(fieldtype: Field | FieldType): boolean {
  if (typeof fieldtype !== 'string') {
    fieldtype = fieldtype?.fieldtype;
  }

  const numericTypes: FieldType[] = [
    FieldTypeEnum.Int,
    FieldTypeEnum.Float,
    FieldTypeEnum.Currency,
  ];

  return numericTypes.includes(fieldtype);
}
