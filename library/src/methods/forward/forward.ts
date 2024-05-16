import type {
  BaseIssue,
  BaseValidation,
  IssuePathItem,
} from '../../types/index.ts';
import type { PathKeys } from './types.ts';

// TODO: We should try to find a better way to type this function without
// breaking the type inference, as the current implementation loses some type
// information by returning a `BaseValidation` instead of the original type.

/**
 * Forwards the issues of the passed validation action.
 *
 * @param action The validation action.
 * @param pathKeys The path keys.
 *
 * @returns The modified action.
 */
export function forward<
  TInput extends Record<string, unknown> | unknown[],
  TIssue extends BaseIssue<unknown>,
>(
  action: BaseValidation<TInput, TInput, TIssue>,
  pathKeys: PathKeys<TInput>
): BaseValidation<TInput, TInput, TIssue> {
  return {
    ...action,
    _run(dataset, config) {
      // Run validation action
      action._run(dataset, config);

      // If dataset contains issues, forward them
      if (dataset.issues) {
        for (const issue of dataset.issues) {
          // Create path input variable
          let pathInput: unknown = dataset.value;

          // Try to forward issue to end of path list
          for (const key of pathKeys) {
            // Create path value variable
            // @ts-expect-error
            const pathValue: unknown = pathInput[key];

            // Create path item for current key
            const pathItem: IssuePathItem = {
              type: 'unknown',
              origin: 'value',
              input: pathInput,
              key,
              value: pathValue,
            };

            // Forward issue by adding path item
            if (issue.path) {
              issue.path.push(pathItem);
            } else {
              // @ts-expect-error
              issue.path = [pathItem];
            }

            // If path value is undefined, stop forwarding
            if (!pathValue) {
              break;
            }

            // Set next path input to current path value
            pathInput = pathValue;
          }
        }
      }

      // Return output dataset
      return dataset;
    },
  };
}