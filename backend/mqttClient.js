// backend/mqttClient.js
import mqtt from 'mqtt';
import { factoryState } from './server.js'; // will be set later via a setter
import { saveSensorData } from './db.js';

let client = null;

export function initMqttClient() {
  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://test.mosquitto.org:1883';
  client = mqtt.connect(brokerUrl);
  client.on('connect', () => {
    console.log('🔌 Connected to MQTT broker:', brokerUrl);
    client.subscribe('factory/sensors/#', (err) => {
      if (err) console.error('❗ MQTT subscription error:', err);
    });
  });
  client.on('message', (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      // Expected payload: { zoneId: 'ZoneA', temp: 22.3, humidity: 45, workers: 3 }
      const { zoneId } = payload;
      if (zoneId && factoryState.zones[zoneId]) {
        const zone = factoryState.zones[zoneId];
        if (payload.temp !== undefined) zone.temp = payload.temp;
        if (payload.humidity !== undefined) zone.humidity = payload.humidity;
        if (payload.workers !== undefined) {
          zone.workers = payload.workers;
          zone.density = zone.workers === 0 ? 'Empty' : zone.workers >= 4 ? 'Crowded' : 'Normal';
        }
        // Persist to SQLite
        saveSensorData(zoneId, payload);
        // Log the update
        factoryState.logs.push({
          timestamp: new Date().toLocaleTimeString(),
          type: 'sensor',
          zone: zoneId,
          message: `[MQTT] ${zone.name} sensor update: ${JSON.stringify(payload)}`
        });
      }
    } catch (e) {
      console.error('❗ Failed to process MQTT message', e);
    }
  });
  client.on('error', (err) => {
    console.error('❗ MQTT error:', err);
  });
}

export function getMqttClient() {
  return client;
}
