// Declara a variável `mqttClient` no escopo global
let mqttClient;
let sosTimeout; // Timeout para gerenciar o timer do SOS

// Função que se conecta ao broker MQTT
function connectToBroker() {
  const clientId = "client" + Math.random().toString(36).substring(7);
  const host = "wss://test.mosquitto.org:8081/mqtt";

  const options = {
    keepalive: 60,
    clientId: clientId,
    protocolId: "MQTT",
    protocolVersion: 4,
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
    rejectUnauthorized: false
  };

  console.log("Tentando conectar ao broker...");
  mqttClient = mqtt.connect(host, options);

  mqttClient.on("error", (err) => {
    console.log("Erro de conexão: ", err);
    mqttClient.end();
  });

  mqttClient.on("reconnect", () => {
    console.log("Reconnecting...");
  });

  mqttClient.on("connect", () => {
    console.log("Conectado ao Broker Mosquitto com ID: " + clientId);
    mqttClient.subscribe("esp32/accStatus");
    mqttClient.subscribe("esp32/sosStatus");
  });

  mqttClient.on("message", (topic, message) => {
    if (topic === "esp32/accStatus") {
      document.getElementById("accStatus").innerText = message.toString();
    } else if (topic === "esp32/sosStatus") {
      document.getElementById("sosStatus").innerText = message.toString();
    }
    console.log("Mensagem recebida no tópico", topic, ":", message.toString());
  });
}

// Função para enviar um comando para o ESP32
function sendCommand(command) {
  const topic = "esp32/control";
  console.log(`Enviando comando: ${command} para o tópico: ${topic}`);
  mqttClient.publish(topic, command);
}

// Função para iniciar o evento SOS com timer de 3 segundos e registrar a data/hora
function startSOSTimer() {
  let timeLeft = 3;
  const timerDisplay = document.getElementById("timer");
  const sosStatusDisplay = document.getElementById("sosStatus");

  sosStatusDisplay.innerText = "Evento SOS iniciado!";
  timerDisplay.innerText = `Tempo restante: ${timeLeft} segundos`;

  sosTimeout = setInterval(() => {
    timeLeft -= 1;
    if (timeLeft > 0) {
      timerDisplay.innerText = `Tempo restante: ${timeLeft} segundos`;
    } else {
      clearInterval(sosTimeout);
      timerDisplay.innerText = "";
      sosStatusDisplay.innerText = "Evento Gerado!";
      logSosEvent(); // Registra o evento SOS com data e hora
    }
  }, 1000);
}

// Função para registrar o evento SOS com data e hora
function logSosEvent() {
  const eventList = document.getElementById("eventList");
  const eventItem = document.createElement("li");
  const now = new Date();
  eventItem.innerText = `Evento SOS gerado em: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
  eventList.appendChild(eventItem);
}

// Executa ao carregar a página
window.addEventListener("load", () => {
  console.log("Página carregada. Iniciando conexão com o broker MQTT...");
  connectToBroker();

  // Configura os eventos dos botões para enviar comandos
  document.getElementById("sosButton").addEventListener("click", () => {
    sendCommand("SOS");
    startSOSTimer();
  });

  document.getElementById("accButton").addEventListener("click", () => {
    sendCommand("ACC");
  });
});
