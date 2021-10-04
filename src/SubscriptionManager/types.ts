export type SubscriptionHandler<A extends any[]> = (...args: A) => void;

/**
 * @internal
 */
export interface Subscription {
  _managerID: symbol;
  /** Indicates if this subscription can still receive notifications. Calling `remove()` will set this flag to `false`. */
  isActive: boolean;
  /** Remove this subscription, it won't receive any more notifications. */
  remove(): void;
}

/**
 * @internal
 */
export interface SubscriptionManager<A extends any[]> {
  _managerID: symbol;
  /** Add new subscription. Each handler can be subscribed only once. */
  subscribe(handler: SubscriptionHandler<A>): Subscription;
  /** Notify all active subscribers. */
  notify(...args: A): void;
  /** Check if the provided subscription is an active subscriber of this manager. */
  isSubscriber(subscription: Subscription | SubscriptionHandler<A>): boolean;
}

/**
 * @internal
 */
export type SubscribeFn<A extends any[]> = SubscriptionManager<A>["subscribe"];

/**
 * @internal
 */
export type NotifyFn<A extends any[]> = SubscriptionManager<A>["notify"];

/**
 * @internal
 */
export type IsSubscriberFn<A extends any[]> =
  SubscriptionManager<A>["isSubscriber"];
