import type { Subscription } from ".";
import type {
  IsSubscriberFn,
  NotifyFn,
  SubscribeFn,
  SubscriptionHandler,
  SubscriptionManager,
} from "./types";

/**
 * @internal
 */
export function createSubscriptionManager<
  A extends any[]
>(): SubscriptionManager<A> {
  const id = Symbol();
  const subscriptions = new Set<SubscriptionHandler<A>>();

  const subscribe: SubscribeFn<A> = (handler) => {
    if (subscriptions.has(handler)) {
      throw new Error("This handler is already a subscriber!");
    }

    subscriptions.add(handler);

    const sub: Subscription = {
      _managerID: id,
      isActive: true,
      remove() {
        subscriptions.delete(handler);

        sub.isActive = false;
        sub.remove = () => {};
      },
    };

    return sub;
  };

  const notify: NotifyFn<A> = (...args: A) => {
    for (const sub of [...subscriptions.values()]) {
      sub(...args);
    }
  };

  const isSubscriber: IsSubscriberFn<A> = (sub) => {
    if (typeof sub === "function") {
      return subscriptions.has(sub);
    }
    if (sub._managerID === id) {
      return sub.isActive;
    }
    return false;
  };

  return {
    _managerID: id,
    notify,
    subscribe,
    isSubscriber,
  };
}
