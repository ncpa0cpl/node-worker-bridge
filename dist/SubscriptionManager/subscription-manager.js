"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubscriptionManager = void 0;
/**
 * @internal
 */
function createSubscriptionManager() {
    const id = Symbol();
    const subscriptions = new Set();
    const subscribe = (handler) => {
        if (subscriptions.has(handler)) {
            throw new Error("This handler is already a subscriber!");
        }
        subscriptions.add(handler);
        const sub = {
            _managerID: id,
            isActive: true,
            remove() {
                subscriptions.delete(handler);
                sub.isActive = false;
                sub.remove = () => { };
            },
        };
        return sub;
    };
    const notify = (...args) => {
        for (const sub of [...subscriptions.values()]) {
            sub(...args);
        }
    };
    const isSubscriber = (sub) => {
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
exports.createSubscriptionManager = createSubscriptionManager;
