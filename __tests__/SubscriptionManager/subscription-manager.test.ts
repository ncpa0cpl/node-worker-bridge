import { createSubscriptionManager } from "../../src/SubscriptionManager";

describe("createSubscriptionManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should correctly trigger the subscriber handler on each notify", () => {
    const subManager = createSubscriptionManager<[string, number]>();

    const subOneMock = jest.fn();
    const subTwoMock = jest.fn();

    subManager.subscribe(subOneMock);
    subManager.subscribe(subTwoMock);

    subManager.notify("foo", 512);

    expect(subOneMock).toHaveBeenCalledTimes(1);
    expect(subOneMock).toHaveBeenLastCalledWith("foo", 512);

    expect(subTwoMock).toHaveBeenCalledTimes(1);
    expect(subTwoMock).toHaveBeenLastCalledWith("foo", 512);

    subManager.notify("bar", 128);

    expect(subOneMock).toHaveBeenCalledTimes(2);
    expect(subOneMock).toHaveBeenLastCalledWith("bar", 128);

    expect(subTwoMock).toHaveBeenCalledTimes(2);
    expect(subTwoMock).toHaveBeenLastCalledWith("bar", 128);

    subManager.notify("baz", 64);

    expect(subOneMock).toHaveBeenCalledTimes(3);
    expect(subOneMock).toHaveBeenLastCalledWith("baz", 64);

    expect(subTwoMock).toHaveBeenCalledTimes(3);
    expect(subTwoMock).toHaveBeenLastCalledWith("baz", 64);
  });

  it("should notify all subscribers that were present at the time of emitting notification", () => {
    const subManager = createSubscriptionManager<[string, number]>();

    const subOneMock = jest.fn();
    const subTwoMock = jest.fn();
    const subThreeMock = jest.fn();

    const s1 = subManager.subscribe((...args) => {
      s2.remove();
      s3.remove();
      subOneMock(...args);
    });
    const s2 = subManager.subscribe((...args) => {
      s1.remove();
      s3.remove();
      subTwoMock(...args);
    });
    const s3 = subManager.subscribe((...args) => {
      s1.remove();
      s2.remove();
      subThreeMock(...args);
    });

    subManager.notify("foo", 512);

    expect(subOneMock).toHaveBeenCalledTimes(1);
    expect(subOneMock).toHaveBeenLastCalledWith("foo", 512);

    expect(subTwoMock).toHaveBeenCalledTimes(1);
    expect(subTwoMock).toHaveBeenLastCalledWith("foo", 512);

    expect(subThreeMock).toHaveBeenCalledTimes(1);
    expect(subThreeMock).toHaveBeenLastCalledWith("foo", 512);
  });

  it("should not send notifications to the removed subscribers", () => {
    const subManager = createSubscriptionManager<[string, number]>();

    const subOneMock = jest.fn();
    const subTwoMock = jest.fn();

    subManager.subscribe(subOneMock);
    const s2 = subManager.subscribe(subTwoMock);

    subManager.notify("foo", 512);

    expect(subOneMock).toHaveBeenCalledTimes(1);
    expect(subOneMock).toHaveBeenLastCalledWith("foo", 512);

    expect(subTwoMock).toHaveBeenCalledTimes(1);
    expect(subTwoMock).toHaveBeenLastCalledWith("foo", 512);

    s2.remove();

    subManager.notify("bar", 128);

    expect(subOneMock).toHaveBeenCalledTimes(2);
    expect(subOneMock).toHaveBeenLastCalledWith("bar", 128);

    expect(subTwoMock).toHaveBeenCalledTimes(1);

    subManager.notify("baz", 64);

    expect(subOneMock).toHaveBeenCalledTimes(3);
    expect(subOneMock).toHaveBeenLastCalledWith("baz", 64);

    expect(subTwoMock).toHaveBeenCalledTimes(1);
  });

  it("should throw an error when subscribing the same handler more than once", () => {
    const subManager = createSubscriptionManager<[string, number]>();

    const subOneMock = jest.fn();

    subManager.subscribe(subOneMock);

    expect(() => subManager.subscribe(subOneMock)).toThrowError();
  });

  it("should not throw an error when subscribing the same handler after removing it once", () => {
    const subManager = createSubscriptionManager<[string, number]>();

    const subOneMock = jest.fn();

    const sub = subManager.subscribe(subOneMock);

    sub.remove();

    expect(() => subManager.subscribe(subOneMock)).not.toThrowError();
  });

  it("should correctly update the 'isActive' flag", () => {
    const subManager = createSubscriptionManager<[string, number]>();

    const subOneMock = jest.fn();
    const subTwoMock = jest.fn();

    const s1 = subManager.subscribe(subOneMock);
    const s2 = subManager.subscribe(subTwoMock);

    expect(s1.isActive).toEqual(true);
    expect(s2.isActive).toEqual(true);

    s1.remove();

    expect(s1.isActive).toEqual(false);
    expect(s2.isActive).toEqual(true);

    s2.remove();

    expect(s1.isActive).toEqual(false);
    expect(s2.isActive).toEqual(false);
  });

  describe("isSubscriber()", () => {
    it("should correctly report which subscriptions/handlers are active", () => {
      const subManager = createSubscriptionManager<[string, number]>();

      const subOneMock = jest.fn();
      const subTwoMock = jest.fn();

      const s1 = subManager.subscribe(subOneMock);
      const s2 = subManager.subscribe(subTwoMock);

      expect(subManager.isSubscriber(s1)).toEqual(true);
      expect(subManager.isSubscriber(s2)).toEqual(true);

      expect(subManager.isSubscriber(subOneMock)).toEqual(true);
      expect(subManager.isSubscriber(subTwoMock)).toEqual(true);

      s1.remove();

      expect(subManager.isSubscriber(s1)).toEqual(false);
      expect(subManager.isSubscriber(s2)).toEqual(true);

      expect(subManager.isSubscriber(subOneMock)).toEqual(false);
      expect(subManager.isSubscriber(subTwoMock)).toEqual(true);

      s2.remove();

      expect(subManager.isSubscriber(s1)).toEqual(false);
      expect(subManager.isSubscriber(s2)).toEqual(false);

      expect(subManager.isSubscriber(subOneMock)).toEqual(false);
      expect(subManager.isSubscriber(subTwoMock)).toEqual(false);
    });

    it("should correctly return false for subscriptions from other managers", () => {
      const subManager1 = createSubscriptionManager<[string, number]>();
      const subManager2 = createSubscriptionManager<[string, number]>();

      const sub = subManager1.subscribe(() => {});

      expect(subManager2.isSubscriber(sub)).toEqual(false);
    });
  });
});
