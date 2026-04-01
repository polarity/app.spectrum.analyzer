let audioContext
let analyser
let bufferLength
let dataArray
let currentStream
let currentSource
let selectedAudioInputId = ''
let hasStarted = false
let onAnalysisStarted = () => {}

export let rmsHistory
export let rmsDataArray

/**
 * Sets up audio-related UI events without requesting microphone access up front.
 *
 * @param {Function} handleAnalysisStarted - Callback invoked after a successful start or device switch
 */
export function setupAudio(handleAnalysisStarted = () => {}) {
  onAnalysisStarted = handleAnalysisStarted

  const select = document.getElementById('audioInput')
  const startButton = document.getElementById('controls-start-button')

  showStartButton()

  select.addEventListener('change', () => {
    handleAudioInputChange(select.value)
  })

  startButton.addEventListener('click', async () => {
    startButton.disabled = true

    try {
      await startAnalyzing()
    } catch (error) {
      // startAnalyzing already logs and restores UI state
    } finally {
      startButton.disabled = false
    }
  })

  navigator.mediaDevices.addEventListener('devicechange', () => {
    if (hasStarted) {
      updateAudioInputs()
    }
  })
}

/**
 * Starts or restarts analysis with the provided device id.
 *
 * @param {string} [deviceId] - Requested audio input device id
 * @returns {Promise<void>}
 */
export async function startAnalyzing(deviceId) {
  if (typeof deviceId === 'string') {
    selectedAudioInputId = deviceId
  }

  try {
    await teardownAudio()
    await initializeAudioContext()

    const stream = await getAudioStream()
    currentStream = stream
    currentSource = audioContext.createMediaStreamSource(stream)
    currentSource.connect(analyser)

    hasStarted = true
    showAudioInputSelect()
    await updateAudioInputs(stream)
    onAnalysisStarted()
  } catch (error) {
    console.error('Error accessing audio stream:', error)
    hasStarted = false
    showStartButton()
    throw error
  }
}

/**
 * Updates the available audio input list after permissions are granted.
 *
 * @param {MediaStream} [stream] - Current active audio stream
 * @returns {Promise<void>}
 */
export async function updateAudioInputs(stream = currentStream) {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const audioInputs = devices.filter(device => device.kind === 'audioinput')
    const select = document.getElementById('audioInput')
    const resolvedDeviceId = resolveSelectedAudioInputId(audioInputs, stream)

    select.innerHTML = ''

    select.appendChild(createOption('', 'Default'))

    audioInputs.forEach((input, index) => {
      const label = input.label || `Microphone ${index + 1}`
      select.appendChild(createOption(input.deviceId, label))
    })

    select.value = resolvedDeviceId || ''
    if (select.value !== (resolvedDeviceId || '')) {
      select.value = ''
    }
  } catch (error) {
    console.error('Error enumerating audio devices:', error)
  }
}

/**
 * Handles a user-initiated audio device change.
 *
 * @param {string} deviceId - Selected device id
 */
async function handleAudioInputChange(deviceId) {
  const select = document.getElementById('audioInput')
  select.disabled = true

  try {
    await startAnalyzing(deviceId)
  } catch (error) {
    // startAnalyzing already logs and restores UI state
  } finally {
    select.disabled = false
  }
}

/**
 * Initializes a fresh audio context and analyser chain.
 */
async function initializeAudioContext() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)()
  analyser = audioContext.createAnalyser()
  analyser.fftSize = 8192
  bufferLength = analyser.frequencyBinCount
  dataArray = new Uint8Array(bufferLength)
  rmsDataArray = new Uint8Array(bufferLength)
  rmsHistory = Array.from({ length: bufferLength }, () => [])
}

/**
 * Requests a microphone stream for the currently selected device.
 *
 * @returns {Promise<MediaStream>} The active media stream
 */
async function getAudioStream() {
  return navigator.mediaDevices.getUserMedia({
    audio: getAudioConstraints()
  })
}

/**
 * Builds audio constraints for the current requested device.
 *
 * @returns {MediaTrackConstraints} Audio constraints
 */
function getAudioConstraints() {
  if (selectedAudioInputId) {
    return { deviceId: { exact: selectedAudioInputId } }
  }

  return true
}

/**
 * Stops all active audio resources before reconnecting.
 */
async function teardownAudio() {
  if (currentSource) {
    currentSource.disconnect()
    currentSource = null
  }

  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop())
    currentStream = null
  }

  if (audioContext) {
    await audioContext.close()
    audioContext = null
  }

  analyser = null
  bufferLength = 0
  dataArray = null
  rmsDataArray = null
  rmsHistory = null
}

/**
 * Resolves which device id should be shown as selected in the UI.
 *
 * @param {MediaDeviceInfo[]} audioInputs - Available audio input devices
 * @param {MediaStream} [stream] - Current active audio stream
 * @returns {string} The selected device id or empty string for default
 */
function resolveSelectedAudioInputId(audioInputs, stream) {
  const availableDeviceIds = new Set(audioInputs.map(input => input.deviceId))
  const activeTrack = stream ? stream.getAudioTracks()[0] : null
  const activeDeviceId = activeTrack && activeTrack.getSettings
    ? activeTrack.getSettings().deviceId
    : ''

  if (activeDeviceId && availableDeviceIds.has(activeDeviceId)) {
    return activeDeviceId
  }

  if (selectedAudioInputId && availableDeviceIds.has(selectedAudioInputId)) {
    return selectedAudioInputId
  }

  return ''
}

/**
 * Shows the start button and hides the post-start audio selector.
 */
function showStartButton() {
  const startButton = document.getElementById('controls-start-button')
  const audioInputField = document.getElementById('audio-input-field')

  startButton.classList.remove('is-hidden')
  audioInputField.classList.add('is-hidden')
}

/**
 * Keeps the start button visible and reveals the post-start audio selector.
 */
function showAudioInputSelect() {
  const audioInputField = document.getElementById('audio-input-field')

  audioInputField.classList.remove('is-hidden')
}

/**
 * Creates an option element for the audio input selector.
 *
 * @param {string} value - Option value
 * @param {string} text - Option label
 * @returns {HTMLOptionElement} The option element
 */
function createOption(value, text) {
  const option = document.createElement('option')
  option.value = value
  option.textContent = text
  return option
}

/**
 * Creates a window function for frequency analysis.
 *
 * @returns {Float32Array} The generated window function.
 */
const windowFunction = new Float32Array(8192)

for (let i = 0; i < 8192; i++) {
  windowFunction[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / 8192))
}

export { analyser, audioContext, bufferLength, dataArray, windowFunction }
