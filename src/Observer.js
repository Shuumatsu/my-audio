import { AutoInitObject } from './utils'

class Subscription {

  subscribed = false
  symbol = Symbol()

  subscribe(observer) {
    this.subscribed = true
    this.observer = observer
  }

  unsubscribe() {
    this.observer.unsubscribe(this)
    this.subscribed = false
  }
}

export default class Observer {

  subscriptions = new AutoInitObject()

  constructor(el) {
    if (el) {
      this.el = el
      return
    }
    throw new Error('element to be observed is required')
  }

  subscribe(evt, fn, ctx) {
    const subscription = new Subscription()

    const callback = (...args) => subscription.subscribed && fn.call(ctx, ...args)
    this.el.addEventListener(evt, fn)
    subscription.subscribe(this)

    this.subscriptions[subscription.symbol] = [evt, callback]

    return subscription
  }

  unsubscribe(subscription) {
    this.el.removeEventListener(...this.subscriptions[subscription.symbol])
    this.subscriptions[subscription.symbol] = null

    return subscription
  }
}