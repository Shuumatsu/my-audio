// it's suggested that only one audioContext in one page
const audioContext = window.audioContext || new AudioContext()

const audioDuration = audio =>
  new Promise(resolve => {
    if (audio.duration) {
      resolve(audio.duration)
    }

    audio.addEventListener('loadedmetadata', () => resolve(audio.duration))
  })

class AudioTemplate extends HTMLElement {

  static observedAttributes = ['src', 'volume', 'mode', 'show-lyrics', 'srcs', 'status']
  static clickActions = ['playButton', 'pauseButton', 'stopButton']
  static changeActions = ['volumeInput']

  constructor() {
    super()

    const shadowRoot = this.attachShadow({ mode: 'open' })
    const template = document.querySelector('#audio-template')
    shadowRoot.appendChild(template.content.cloneNode(true))

    this.nativeAudio = shadowRoot.querySelector('#native-audio')
    this.nativeAudio.src = this.src

    this.durationElement = shadowRoot.querySelector('#duration')
    audioDuration(this.nativeAudio).then(duration => {
      this.duration = duration
      this.durationElement.textContent = duration
    })

    const download = shadowRoot.querySelector('#download')
    download.href = this.src

    this.audioSource = audioContext.createMediaElementSource(this.nativeAudio)
    this.analyserNode = audioContext.createAnalyser()

    this.analyserNode.fftSize = 64
    this.analyserNode.smoothingTimeConstan = 0.85
    const bufferLength = this.analyserNode.frequencyBinCount
    this.dataArray = new Uint8Array(bufferLength)

    this.audioSource.connect(this.analyserNode)
    this.analyserNode.connect(audioContext.destination)

    this.visualization = shadowRoot.querySelector('#visualization')
  }

  draw() {
    if (this.status === 'stopped') ctx.clearRect(0, 0, visualization.width, visualization.height)
    if (this.status !== 'playing') return

    const visualization = this.visualization
    const ctx = visualization.getContext('2d')
    const analyserNode = this.analyserNode
    const dataArray = this.dataArray

    analyserNode.getByteFrequencyData(dataArray)

    const sliceWidth = Math.floor(visualization.width / dataArray.length)

    ctx.clearRect(0, 0, visualization.width, visualization.height)
    dataArray.forEach((uint, i) => {
      ctx.fillStyle = `rgb(${uint}, 50, 50)`
      ctx.fillRect(i * sliceWidth, visualization.height - uint / 2, sliceWidth, uint)
    })

    requestAnimationFrame(() => this.draw())
  }

  playButtonHandler = () => this.status = 'playing'
  pauseButtonHandler = () => this.status = 'paused'
  stopButtonHandler = () => this.status = 'stopped'
  volumeInputHandler = () => this.volume = this.volumeInput.value / 100

  connectedCallback() {
    AudioTemplate.clickActions.forEach(action => {
      const dash = action.replace(/[A-Z]/g, match => '-' + match.toLowerCase())
      this[action] = this.shadowRoot.querySelector(`#${dash}`)
      this[action].addEventListener('click', this[`${action}Handler`])
    })
    AudioTemplate.changeActions.forEach(action => {
      const dash = action.replace(/[A-Z]/g, match => '-' + match.toLowerCase())
      this[action] = this.shadowRoot.querySelector(`#${dash}`)
      this[action].addEventListener('change', this[`${action}Handler`])
    })
  }

  disconnectedCallback() {
    AudioTemplate.clickActions.forEach(action => {
      this[action].removeEventListener('click', this[`${action}Handler`])
    })
    AudioTemplate.changeActions.forEach(action => {
      this[action].removeEventListener('change', this[`${action}Handler`])
    })
  }

  statusControl(status) {
    switch (status) {
      case 'stopped':
        this.nativeAudio.pause()
        this.nativeAudio.currentTime = 0
        break
      case 'playing':
        this.nativeAudio.play()
        this.draw()
        break
      case 'paused':
        this.nativeAudio.pause()
        break
    }
  }

  modeControl(mode) {
    switch (mode) {
      case 'loop':
        this.nativeAudio.loop = true
        break
      case 'random':

        break
      case 'sequential':
        break
    }
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    switch (attrName) {
      case 'status':
        this.statusControl(newVal)
        break
      case 'src':
        this.nativeAudio[attrName] = newVal
        break
      case 'volume':
        this.nativeAudio.volume = newVal
        break
      default:
    }
  }
}

AudioTemplate.observedAttributes.forEach(attribute => {
  Object.defineProperty(AudioTemplate.prototype, attribute, {
    configurable: false,
    enumerable: true,
    get() {
      return this.getAttribute(attribute)
    },
    set(val) {
      // nil check
      if (val == null) this.setAttribute(attribute)
      else this.setAttribute(attribute, val)
    }
  })
})

customElements.define('audio-template', AudioTemplate)