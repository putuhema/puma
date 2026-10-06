/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as guestbook from "../guestbook.js";
import type * as limits from "../limits.js";
import type * as listeners from "../listeners.js";
import type * as messages from "../messages.js";
import type * as presence from "../presence.js";
import type * as scores from "../scores.js";
import type * as transmissions from "../transmissions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  guestbook: typeof guestbook;
  limits: typeof limits;
  listeners: typeof listeners;
  messages: typeof messages;
  presence: typeof presence;
  scores: typeof scores;
  transmissions: typeof transmissions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
