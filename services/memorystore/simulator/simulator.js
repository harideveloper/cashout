const { PubSub } = require('@google-cloud/pubsub');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config.json');

const { projectId, pubsub } = config;
const { openbet, closebet, oddchange } = pubsub;

const pubSubClient = new PubSub({ projectId });

const betId = uuidv4();
console.log('Generated UUID:', betId);

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
  /*
  "compositeId" : "GrandNational:FlyingFox:Towin:Customer12345:881044cb-5ced-4d32-9e1e-db7b3a4eb66f"
  "event" : "GrandNational",
  "participant" : "FlyingFox",
  "outcome" : "ToWin",
  "customer" : "Customer12345",
  "betId" : "881044cb-5ced-4d32-9e1e-db7b3a4eb66f",
  "betAmount" : "10.00",
  "betOdd" : "7.5",
  "likelihood" : "0.3",
  "reduceFactor" : "0.8",
  "endtime" : "1718025760",
  "algorithm" : "betAmount*betOdd*likelihood*reduceFactor",
  ""
  */

  const timestamp = Date.now();
  const betId = uuidv4();

  const event = "GrandNational";
  const participant = "FlyingFox";
  const outcome = "ToWin";
  const customer = Math.floor(Math.random() * 100000);
  const betAmount = parseFloat((Math.random() * 1000).toFixed(2))
  const betOdd = parseFloat((Math.random() * 1).toFixed(1))
  const likelihood = parseFloat((Math.random() * 1).toFixed(1))
  const reduceFactor = parseFloat((Math.random() * 1).toFixed(1))
  
  return {
    compositeId : `${event}:${participant}:${outcome}:Customer${customer}:${betId}`,
    event: event,
    participant : participant,
    outcome: outcome,
    customer: `Customer${customer}`,
    betId: betId,
    betAmount : betAmount,
    betOdd: betOdd,
    likelihood: likelihood,
    reduceFactor: reduceFactor,
    endTime : timestamp,
    algorithm : `${betAmount}*${betOdd}*${likelihood}*${reduceFactor}`
  };
}

// Function to generate dynamic closed bet data
function generateClosedBets() {
  const event = "GrandNational";
  const participant = "FlyingFox";
  const outcome = "ToWin";
  const customer = Math.floor(Math.random() * 100000);
  const betId = uuidv4();

  return {
    // compositeId : `${event}:${participant}:${outcome}:${customer}:${betId}`,
    compositeId : "GrandNational:FlyingFox:ToWin:Customer8399:c08eff91-2939-42cb-a8a2-124f9be54301",
  };
}


// Function to generate dynamic bet data
function generateOddChanges() {
    const event = "GrandNational";
    const participant = "FlyingFox";
    const outcome = "ToWin";
    const betAmount = parseFloat((Math.random() * 1000).toFixed(2))
    const latestOdds = parseFloat((Math.random() * 1).toFixed(1))
    const likelihood = parseFloat((Math.random() * 1).toFixed(1))
    const reduceFactor = parseFloat((Math.random() * 1).toFixed(1)) 

    return {
      compositeId : `${event}:${participant}:${outcome}`,
      likelihood: likelihood,
      //latestOdds: latestOdds,
      latestOdds: "8.8",
      algorithm : `${betAmount}*${latestOdds}*${likelihood}*${reduceFactor}`,
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
  const newBetsPerSecond = 5; // Open Bets per second 
  const closedBetsPerSecond = 5; // Close Bets per second 
  const durationInSeconds = 5; // duration in seconds

  // Odds Changes
  const oddsPerSecond = 5; // Odd Changes  per second 
  const oddDurationInSeconds = 5; // Odd Change duration in seconds

  //await openBets(newBetsPerSecond, durationInSeconds);
  //await closedBets(closedBetsPerSecond, durationInSeconds);
  await oddChanges(oddsPerSecond, oddDurationInSeconds);
})();