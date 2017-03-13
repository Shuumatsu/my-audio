export const audioDuration = audio =>
  new Promise(resolve => {
    if (audio.duration) {
      resolve(audio.duration)
    }

    audio.addEventListener('loadedmetadata', () => resolve(audio.duration))
  })

export const attachShadowRoot = (root, selector, mode) => {
  const shadowRoot = root.attachShadow({ mode })
  const template = document.querySelector(selector)
  shadowRoot.appendChild(template.content.cloneNode(true))
}

export const camelToDash = (str = '') => str.replace(/[A-Z]/g, match => '-' + match.toLowerCase())

export const observedAttributesConstructor = (arr = []) => {
  let res = []
  arr.forEach(v => {
    const dash = camelToDash(v)
    if (dash !== v)
      res = res.concat([dash, v])
    else
      res.push(v)
  })

  return res
}


export function AutoInitObject() {
  return new Proxy({}, {
    get(target, key, receiver) {
      if (!(key in target))
        target[key] = AutoInitObject()

      return Reflect.get(target, key, receiver)
    }
  })
}
