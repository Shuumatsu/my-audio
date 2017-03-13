import { attributeDecorator } from './decorators'
import { attachShadowRoot, observedAttributesConstructor } from './utils'

const observedAttributes = observedAttributesConstructor(['value', 'step', 'min', 'max', 'disabled'])

@attributeDecorator(observedAttributes)
export default class MaterialRange extends HTMLElement {

  static observedAttributes = observedAttributes

  constructor() {
    super()

    attachShadowRoot(this, '#material-range', 'open')

    this.leftTrack = this.shadowRoot.querySelector('#left-track')
    this.rightTrack = this.shadowRoot.querySelector('#right-track')

    this.nativeRange = this.shadowRoot.querySelector('#native-range')
    this.nativeRange.addEventListener('change', () => this.value = this.nativeRange.value)  

    this.nativeRange.max = this.max
    this.nativeRange.min = this.min
    this.nativeRange.step = this.step

    this.valueChangeReaction()
    this.disabledChangeReaction()
  }

  valueChangeReaction() {
    const value = this.value || '0'

    this.nativeRange.value = value

    this.leftTrack.style.flex = `${value} 1 0`
    this.rightTrack.style.flex = `${(1 - value)} 1 0`

    if (value === '0') this.nativeRange.classList.add('rest')
    else this.nativeRange.classList.remove('rest')
  }

  disabledChangeReaction() {
    if (this.disabled === true)
      this.nativeRange.setAttribute('disabled', true)
    else
      this.nativeRange.removeAttribute('disabled')
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    if (attrName === 'value') {
      this.valueChangeReaction()
      return
    }
    if (attrName === 'disabled') {
      this.disabledChangeReaction()
      return
    }
    this.nativeRange[attrName] = newVal
  }

  addEventListener(...args) {
    return this.nativeRange.addEventListener(...args)
  }

  removeEventListener(...args) {
    return this.nativeRange.removeEventListener(...args)
  }
}
