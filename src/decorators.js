import { camelToDash } from './utils'

export const actionDecorator = ({ clickActions = [], changeActions = [] }) => constructor => {
  constructor.prototype.connectedCallback = function () {
    clickActions.forEach(action => {
      const dash = camelToDash(action)
      this[action] = this.shadowRoot.querySelector(`#${dash}`)
      this[action].addEventListener('click', this[`${action}Handler`])
    })
    changeActions.forEach(action => {
      const dash = camelToDash(action)
      this[action] = this.shadowRoot.querySelector(`#${dash}`)
      this[action].addEventListener('change', this[`${action}Handler`])
    })
  }

  constructor.prototype.disconnectedCallback = function () {
    clickActions.forEach(action => {
      this[action].removeEventListener('click', this[`${action}Handler`])
    })
    changeActions.forEach(action => {
      this[action].removeEventListener('change', this[`${action}Handler`])
    })
  }
}

export const attributeDecorator = (observedAttributes = []) => constructor => {
  observedAttributes.forEach(attribute => {
    const dash = camelToDash(attribute)
    const descriptor = {
      configurable: false,
      enumerable: true,
      get() {
        return this.getAttribute(dash)
      },
      set(val) {
        // nil check
        if (val == null)
          this.removeAttribute(dash, 0)
        else
          this.setAttribute(dash, val)
      }
    }

    Object.defineProperty(constructor.prototype, attribute, descriptor)
  })
}