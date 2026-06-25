<template>
  <div>
    <h1>ESP32 Distanz Sensor Log</h1>
    
    <div>
      <p>Server Status: {{ serverConnected ? 'Verbunden' : 'Getrennt' }}</p>
    </div>

    <div>
      <h2>Letzte Ereignisse:</h2>
      <ul v-if="events.length > 0">
        <li v-for="event in events" :key="event.id">
          [{{ event.time }}] Distanz: {{ event.distance }} cm
        </li>
      </ul>
      <p v-else>Noch keine Daten empfangen...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const events = ref([])
const serverConnected = ref(false)
let interval = null
let lastUpdateCount = 0

const fetchDistance = async () => {
  try {
    const response = await fetch('/api/distance')
    if (response.ok) {
      serverConnected.value = true
      const data = await response.json()
      
      // Nur wenn sich der Zähler geändert hat, ist es ein neues Event vom ESP32!
      if (data.updateCount > lastUpdateCount) {
        lastUpdateCount = data.updateCount
        
        // Neues Event zur Liste hinzufügen (oben)
        events.value.unshift({
          id: data.updateCount,
          time: new Date().toLocaleTimeString(),
          distance: data.distance
        })
        
        // Liste auf maximal 20 Einträge begrenzen
        if (events.value.length > 20) {
          events.value.pop()
        }
      }
    } else {
      serverConnected.value = false
    }
  } catch (error) {
    serverConnected.value = false
  }
}

onMounted(() => {
  fetchDistance()
  // Alle 500ms pollen
  interval = setInterval(fetchDistance, 500)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>
