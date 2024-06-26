const { PubSub } = require('@google-cloud/pubsub');
const config = require('../config.json');

const { projectId, pubsub } = config;
const { openbet, closebet, oddchange } = pubsub;

const pubSubClient = new PubSub({ projectId });

// Function to publish a message to a Pub/Sub topic
async function publishMessage(topicName, data) {
  const dataBuffer = Buffer.from(JSON.stringify(data));
  try {
    const messageId = await pubSubClient.topic(topicName).publish(dataBuffer);
    console.log(`Message ${messageId} published to topic ${topicName}:`, data);
  } catch (error) {
    console.error(`Error publishing to topic ${topicName}:`, error);
  }
}

// Function to generate dynamic bet data
function generateOpenBets() {
  const r_bet = Math.floor(Math.random() * 10000000);
  const r_user = Math.floor(Math.random() * 10000);
  const r_event = Math.floor(Math.random() * 100);
  const r_amount = parseFloat((Math.random() * 1000).toFixed(2))
  const r_odds = parseFloat((Math.random() * 1).toFixed(1))
  const timestamp = Date.now();

  return {
    betID: `${r_bet}_${timestamp}`,
    userID: `${r_user}`,
    eventID: `${r_event}`,
    amount: r_amount,
    odds: r_odds,
    status: "open",
  };
}

// Function to generate dynamic closed bet data
function generateClosedBets() {
  const r_bet = Math.floor(Math.random() * 10000000);
  const timestamp = Date.now();
  return {
    betID: `${r_bet}_${timestamp}`, // Ensure each closed bet has a unique ID based on current timestamp
    status: "closed",
    // betID: "9082486_1719408946624", 
    // status: "closed",

    
  };
}


// Function to generate dynamic bet data
function generateOddChanges() {
    const r_event = Math.floor(Math.random() * 100);
    const r_odds = parseFloat((Math.random() * 1).toFixed(1))
    return {
      eventID: `${r_event}`,
      odds: r_odds,
    //   eventID: "67",
    //   odds: 5.5,
    };
  }

// Function to simulate publishing new bets continuously
async function openBets(messagesPerSecond, durationInSeconds) {
  const interval = 1000 / messagesPerSecond; // Interval in milliseconds
  console.log(`Simulating ${messagesPerSecond} new bets per second with interval ${interval}ms for ${durationInSeconds} seconds`);

  const endTime = Date.now() + durationInSeconds * 1000;

  const intervalId = setInterval(async () => {
    const currentTime = Date.now();
    if (currentTime > endTime) {
      clearInterval(intervalId);
      console.log(`Simulation completed for new bets.`);
      return;
    }
    const betData = generateOpenBets();
    await publishMessage(openbet.topic, betData);
  }, interval);
}

// Function to simulate publishing closed bets continuously
async function closedBets(messagesPerSecond, durationInSeconds) {
  const interval = 1000 / messagesPerSecond; // Interval in milliseconds
  console.log(`Simulating ${messagesPerSecond} closed bets per second with interval ${interval}ms for ${durationInSeconds} seconds`);

  const endTime = Date.now() + durationInSeconds * 1000;

  const intervalId = setInterval(async () => {
    const currentTime = Date.now();
    if (currentTime > endTime) {
      clearInterval(intervalId);
      console.log(`Simulation completed for Odd Changes.`);
      return;
    }
    const closedBetData = generateClosedBets();
    await publishMessage(closebet.topic, closedBetData);
  }, interval);
}

// Function to simulate publishing odd changes continuously
async function oddChanges(messagesPerSecond, durationInSeconds) {
    const interval = 1000 / messagesPerSecond; // Interval in milliseconds
    console.log(`Simulating ${messagesPerSecond} new bets per second with interval ${interval}ms for ${durationInSeconds} seconds`);
  
    const endTime = Date.now() + durationInSeconds * 1000;
  
    const intervalId = setInterval(async () => {
      const currentTime = Date.now();
      if (currentTime > endTime) {
        clearInterval(intervalId);
        console.log(`Simulation completed for Odd bets.`);
        return;
      }
      const oddChangesData = generateOddChanges();
      await publishMessage(oddchange.topic, oddChangesData);
    }, interval);
  }

// Start simulations
(async () => {
  const newBetsPerSecond = 10; // Open Bets per second 
  const closedBetsPerSecond = 10; // Close Bets per second 
  const durationInSeconds = 1; // duration in seconds

  // Odds Changes
  const oddsPerSecond = 10; // Odd Changes  per second 
  const oddDurationInSeconds = 1; // Odd Change duration in seconds

  await openBets(newBetsPerSecond, durationInSeconds);
  await closedBets(closedBetsPerSecond, durationInSeconds);
  //await oddChanges(oddsPerSecond, oddDurationInSeconds);
})();

