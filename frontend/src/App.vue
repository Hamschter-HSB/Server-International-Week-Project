<template>
  <div class="simple-app">
    <h1>AeroSynth Theremin Test-Interface</h1>
    
    <div class="connection-status">
      Status: <strong>{{ serverConnected ? 'ESP32 Live (Verbunden)' : 'Suche Verbindung...' }}</strong>
    </div>

    <div class="section distance-section">
      <h2>Aktuelle Distanz</h2>
      <div class="distance-value">
        <span v-if="currentDistance === null">Warten auf Sensor-Daten...</span>
        <span v-else-if="currentDistance === 0">STANDBY (Gerät ausgeschaltet)</span>
        <span v-else-if="currentDistance < minDistance || currentDistance > maxDistance">
          Außerhalb des Bereichs: <strong>{{ currentDistance }} cm</strong> (Kein Ton)
        </span>
        <span v-else>
          <strong>{{ currentDistance }} cm</strong> (Tonhöhe: {{ Math.round(currentFreq) }} Hz)
        </span>
      </div>
    </div>

    <div class="section audio-controls">
      <h2>Audio &amp; Synthesizer Einstellungen</h2>
      
      <div class="control-group">
        <button @click="toggleSound" class="control-btn" :class="{ 'active': soundEnabled }">
          {{ soundEnabled ? '🔊 Sound stummschalten' : '🔇 Sound aktivieren' }}
        </button>
      </div>

      <div class="control-group">
        <label>Wellenform: </label>
        <button 
          v-for="wave in ['sine', 'triangle', 'sawtooth', 'square']" 
          :key="wave"
          @click="setWaveType(wave)"
          :class="{ 'active': waveType === wave }"
        >
          {{ wave }}
        </button>
      </div>

      <div class="control-group">
        <label>Lautstärke: </label>
        <input 
          type="range" 
          min="0" 
          max="0.8" 
          step="0.05" 
          v-model.number="masterVolume" 
          @input="updateVolume" 
        />
        <span>{{ Math.round(masterVolume * 100) }}%</span>
      </div>

      <div class="control-group">
        <label>Min Frequenz: </label>
        <input type="range" min="60" max="400" step="10" v-model.number="minFreq" />
        <span>{{ minFreq }} Hz (wenn weit weg)</span>
      </div>

      <div class="control-group">
        <label>Max Frequenz: </label>
        <input type="range" min="500" max="2000" step="50" v-model.number="maxFreq" />
        <span>{{ maxFreq }} Hz (wenn nah dran)</span>
      </div>
    </div>

    <div class="section visualizer-section">
      <h2>Oszilloskop Visualisierung</h2>
      <canvas ref="canvasRef" width="600" height="150"></canvas>
    </div>

    <div class="section log-section">
      <h2>Ereignisprotokoll (letzte 10)</h2>
      <ul v-if="events.length > 0">
        <li v-for="event in events" :key="event.id">
          [{{ event.time }}] Distanz: {{ event.distance }} cm - {{ event.status }}
        </li>
      </ul>
      <span v-else>Noch keine Log-Einträge...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const currentDistance = ref(null)
const currentFreq = ref(0)
const isPlaying = ref(false)
const serverConnected = ref(false)
const events = ref([])

const soundEnabled = ref(false)
const masterVolume = ref(0.25)
const waveType = ref('triangle')
const minDistance = ref(5)
const maxDistance = ref(50)
const minFreq = ref(150)
const maxFreq = ref(1200)

const canvasRef = ref(null)
let animationId = null
let wavePhase = 0
let eventSource = null

// Web Audio API
let audioCtx = null
let oscillator = null
let gainNode = null

const initAudio = () => {
  if (audioCtx) return

  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    oscillator = audioCtx.createOscillator()
    gainNode = audioCtx.createGain()

    oscillator.type = waveType.value
    oscillator.frequency.setValueAtTime(minFreq.value, audioCtx.currentTime)
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime)

    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)
    oscillator.start()
  } catch (error) {
    console.error("Web Audio API konnte nicht initialisiert werden:", error)
  }
}

const toggleSound = () => {
  if (!audioCtx) {
    initAudio()
  }

  soundEnabled.value = !soundEnabled.value

  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume()
  }

  updateAudio(currentDistance.value)
}

const setWaveType = (type) => {
  waveType.value = type
  if (oscillator) {
    oscillator.type = type
  }
}

const updateVolume = () => {
  if (gainNode && soundEnabled.value && isPlaying.value) {
    gainNode.gain.setTargetAtTime(masterVolume.value, audioCtx.currentTime, 0.02)
  }
}

const updateAudio = (distance) => {
  if (!audioCtx || !oscillator || !gainNode) return

  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }

  if (distance !== null && distance >= minDistance.value && distance <= maxDistance.value) {
    isPlaying.value = true

    const t = (distance - minDistance.value) / (maxDistance.value - minDistance.value)
    const targetFreq = minFreq.value * Math.pow(maxFreq.value / minFreq.value, 1 - t)
    currentFreq.value = targetFreq

    oscillator.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.08)

    if (soundEnabled.value) {
      gainNode.gain.setTargetAtTime(masterVolume.value, audioCtx.currentTime, 0.04)
    } else {
      gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.04)
    }
  } else {
    isPlaying.value = false
    currentFreq.value = 0
    gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.06)
  }
}

watch([minDistance, maxDistance, minFreq, maxFreq, masterVolume, waveType], () => {
  if (currentDistance.value !== null) {
    updateAudio(currentDistance.value)
  }
})

// SSE Connection
const connectSSE = () => {
  if (eventSource) {
    eventSource.close()
  }

  eventSource = new EventSource('/api/distance-stream')

  eventSource.onopen = () => {
    serverConnected.value = true
  }

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data && data.updateCount !== undefined) {
        const distanceVal = data.distance
        currentDistance.value = distanceVal

        updateAudio(distanceVal)

        if (distanceVal !== null) {
          const inRange = distanceVal >= minDistance.value && distanceVal <= maxDistance.value
          let statusLabel = 'Spielend'
          if (distanceVal === 0) {
            statusLabel = 'Standby (Aus)'
          } else if (distanceVal < minDistance.value) {
            statusLabel = 'Zu nah'
          } else if (distanceVal > maxDistance.value) {
            statusLabel = 'Zu weit'
          }

          events.value.unshift({
            id: data.updateCount,
            time: new Date().toLocaleTimeString(),
            distance: distanceVal,
            status: statusLabel
          })

          if (events.value.length > 10) {
            events.value.pop()
          }
        }
      }
    } catch (e) {
      console.error("Fehler beim Parsen der Sensordaten:", e)
    }
  }

  eventSource.onerror = () => {
    serverConnected.value = false
  }
}

// Visualizer
const drawVisualizer = () => {
  if (!canvasRef.value) return
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  ctx.clearRect(0, 0, w, h)

  let amplitude = 0
  let frequencyFactor = 1
  let speed = 0.03

  if (isPlaying.value && soundEnabled.value) {
    const t = (currentDistance.value - minDistance.value) / (maxDistance.value - minDistance.value)
    amplitude = 10 + (1 - t) * 35 
    frequencyFactor = 1 + (1 - t) * 5
    speed = 0.03 + (1 - t) * 0.08
  } else {
    amplitude = 2
    frequencyFactor = 0.5
    speed = 0.015
  }

  // Draw midline
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, h / 2)
  ctx.lineTo(w, h / 2)
  ctx.stroke()

  // Draw wave
  ctx.beginPath()
  ctx.lineWidth = 2
  ctx.strokeStyle = '#007bff'
  
  for (let x = 0; x < w; x++) {
    let waveFormOffset = 0
    if (waveType.value === 'square') {
      waveFormOffset = Math.sign(Math.sin(x * 0.018 * frequencyFactor + wavePhase)) * amplitude
    } else if (waveType.value === 'sawtooth') {
      waveFormOffset = (((x * 0.015 * frequencyFactor + wavePhase) % Math.PI) / Math.PI - 0.5) * 2 * amplitude
    } else if (waveType.value === 'triangle') {
      waveFormOffset = Math.abs((((x * 0.018 * frequencyFactor + wavePhase) % (Math.PI * 2)) / Math.PI) - 1) * 2 * amplitude - amplitude
    } else {
      waveFormOffset = Math.sin(x * 0.018 * frequencyFactor + wavePhase) * amplitude
    }

    const y = h / 2 + waveFormOffset
    if (x === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  wavePhase += speed
  animationId = requestAnimationFrame(drawVisualizer)
}

onMounted(() => {
  connectSSE()
  drawVisualizer()
})

onUnmounted(() => {
  if (eventSource) {
    eventSource.close()
  }
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (audioCtx) {
    audioCtx.close()
  }
})
</script>

<style scoped>
.simple-app {
  font-family: system-ui, -apple-system, sans-serif;
  max-width: 700px;
  margin: 0 auto;
  padding: 24px;
  color: #333;
  text-align: left;
}

@media (prefers-color-scheme: dark) {
  .simple-app {
    color: #e2e8f0;
  }
}

.connection-status {
  margin-bottom: 20px;
  font-size: 14px;
}

.section {
  border: 1px solid #cbd5e1;
  padding: 16px;
  margin: 16px 0;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.02);
}

@media (prefers-color-scheme: dark) {
  .section {
    border-color: #334155;
    background-color: rgba(255, 255, 255, 0.02);
  }
}

h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

h2 {
  font-size: 18px;
  margin-top: 0;
  margin-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 6px;
}

@media (prefers-color-scheme: dark) {
  h2 {
    border-color: #334155;
  }
}

.control-group {
  margin: 12px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.control-group label {
  min-width: 120px;
  font-weight: bold;
}

button {
  padding: 6px 12px;
  font-size: 14px;
  border: 1px solid #94a3b8;
  background-color: #f8fafc;
  color: #0f172a;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

button:hover {
  background-color: #e2e8f0;
}

button.active {
  background-color: #2563eb;
  color: white;
  border-color: #2563eb;
}

input[type="range"] {
  flex-grow: 1;
  max-width: 250px;
}

canvas {
  width: 100%;
  height: 150px;
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  display: block;
}

@media (prefers-color-scheme: dark) {
  canvas {
    background-color: #0f172a;
    border-color: #334155;
  }
}

ul {
  padding-left: 20px;
  margin: 0;
}

li {
  font-family: monospace;
  margin-bottom: 4px;
}
</style>
