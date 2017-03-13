import { actionDecorator, attributeDecorator } from './decorators'
import { audioDuration, attachShadowRoot, observedAttributesConstructor } from './utils'
import Observer from './Observer'

// it's suggested that only one audioContext in one page
const audioContext = window.audioContext || new AudioContext()

const observedAttributes = observedAttributesConstructor(['src', 'status', 'currentTime', 'volume'])
const changeActions = ['volumeInput', 'progressInput']
const clickActions = ['playButton', 'pauseButton', 'stopButton']

@attributeDecorator(observedAttributes)
@actionDecorator({ changeActions, clickActions })
export default class MyAudio extends HTMLElement {

  static observedAttributes = observedAttributes

  constructor() {
    super()

    attachShadowRoot(this, '#my-audio', 'open')

    this.downloadLink = this.shadowRoot.querySelector('#download')
    this.nativeAudio = this.shadowRoot.querySelector('#native-audio')
    this.durationElement = this.shadowRoot.querySelector('#duration')
    this.progressInput = this.shadowRoot.querySelector('#progress-input')
    this.volumeInput = this.shadowRoot.querySelector('#volume-input')
    this.nativeAudioObserver = new Observer(this.nativeAudio)

    this.progressInput.addEventListener('dragstart', () => {
      this.progressInput.dragging = true
    })
    this.progressInput.addEventListener('dragend', () => {
      this.progressInput.dragging = false
    })

    this.srcChangeReaction()
    this.initAudioCxt()
  }

  initAudioCxt() {
    this.audioSource = audioContext.createMediaElementSource(this.nativeAudio)
    this.analyserNode = audioContext.createAnalyser()

    this.analyserNode.fftSize = 64
    this.analyserNode.smoothingTimeConstan = 0.85
    const bufferLength = this.analyserNode.frequencyBinCount
    this.dataArray = new Uint8Array(bufferLength)

    this.audioSource.connect(this.analyserNode)
    this.analyserNode.connect(audioContext.destination)
  }

  draw() {
    const visualization = this.visualization || this.shadowRoot.querySelector('#visualization')
    const ctx = visualization.getContext('2d')

    if (this.status !== 'playing') {
      if (this.status === 'stopped')
        ctx.clearRect(0, 0, visualization.width, visualization.height)

      return
    }

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
  volumeInputHandler = () => this.volume = this.volumeInput.value
  progressInputHandler = () => {
    this.nativeAudioObserverSubscription && this.nativeAudioObserverSubscription.unsubscribe()
    this.currentTime = this.progressInput.value * this.audioDuration
    this.nativeAudioObserverSubscription = this.nativeAudioObserver.subscribe('timeupdate', function () {
      this.currentTime = this.nativeAudio.currentTime
    }.bind(this))
  }

  srcChangeReaction() {
    this.progressInput.disabled = true
    this.nativeAudioObserverSubscription && this.nativeAudioObserverSubscription.unsubscribe()
    this.nativeAudioObserverSubscription = this.nativeAudioObserver.subscribe('timeupdate', function () {
      this.currentTime = this.nativeAudio.currentTime
    }.bind(this))

    this.nativeAudio.src = this.src
    this.nativeAudio.load()

    this.downloadLink.href = this.src || '#'

    // calc duration
    audioDuration(this.nativeAudio).then(duration => {
      this.progressInput.disabled = false
      this.audioDuration = duration
      this.durationElement.textContent = duration
    })
  }

  statusChangeReaction() {
    switch (this.status) {
      case 'playing':
        this.nativeAudio.play()
        break
      case 'paused':
        this.nativeAudio.pause()
        break
      // defaults to stop
      default:
        this.nativeAudio.pause()
        this.nativeAudio.currentTime = 0
    }
    this.draw()
  }

  volumeChangeReaction() {
    this.nativeAudio.volume = this.valume
    this.volumeInput.value = this.volume
  }

  currentTimeChangeReaction() {
    this.nativeAudio.currentTime = this.currentTime
    if (this.audioDuration && this.progressInputDragging)
      this.progressInput.value = this.currentTime / this.audioDuration
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    switch (attrName) {
      case 'status':
        this.statusChangeReaction()
        break
      case 'src':
        this.srcChangeReaction()
        break
      case 'volume':
        this.nativeAudio.volume = newVal
        break
      case 'current-time':
        this.currentTimeChangeReaction()
        break
      default:
    }
  }
} 