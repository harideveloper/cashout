const { PubSub } = require('@google-cloud/pubsub');
const redis = require('redis');
const config = require('../../config.json');

// Configuration
const { projectId, pubsub, redisConfig } = config;
const { betchange, notifyuser } = pubsub;

// Create a Pub/Sub client
const pubSubClient = new PubSub({ projectId });

// Create a Redis client
const redisClient = redis.createClient({
  host: redisConfig.host,  // Redis forwarder VM external IP
  port: redisConfig.port,
});

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
function calculateCashOut() {
  const cashOutOffer = parseFloat((Math.random() * 1000).toFixed(2))
  return cashOutOffer;
}


async function calculatebetchange() {
  try {
    // Connect to Redis before performing operations (using Promises)
    await redisClient.connect();

    // Create a subscription object for odds changes
    const subscription = pubSubClient.subscription(betchange.subscription);

    // Listen for messages on the subscription
    subscription.on('message', async message => {
      const data = JSON.parse(message.data);
      console.log(`Received bet change message: ${JSON.stringify(data)}`);

      try {
        // Fetch all keys matching the pattern of bets associated with these odds
        const pattern = `${data.compositeId}`;
        const keys = await redisClient.keys(pattern);

        // Update the odds for each bet
        for (const key of keys) {
          const value = await redisClient.get(key);
          const betData = JSON.parse(value);
          // Update the odds in the bet data
          betData.customer = data.customer;
          betData.betId = data.betId;
          betData.event = data.event;
          betData.participant = data.participant;
          betData.betAmount = data.betAmount;
          betData.latestOdd = data.latestOdd;
          betData.cashOutOffer = calculateCashOut();

          // Store the updated bet data back in Redis
          //await redisClient.set(key, JSON.stringify(betData));
          
          console.log(`Cash Out : ${betData.cashOutOffer} for bet ${betData.compositeId}`);

          // Fan Out the bet changes to fan out topic
          const notifyuser = {
            compositeId: betData.compositeId,
            likelihood: betData.likelihood,
            latestOdds: betData.betOdd,
            algorithm: betData.algorithm
          };

         // await publishMessage(notifyuser.topic, notifyuser);
          
        }
      } catch (error) {
        console.error('Error Retrieving Bet Details from Redis:', error);
      } finally {
        message.ack(); // Acknowledge the message
      }
    });

    // Handle errors from the subscription
    subscription.on('error', error => {
      console.error('Subscription error:', error);
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
  }
}
calculatebetchange();





