const { PubSub } = require('@google-cloud/pubsub');
const redis = require('redis');
const config = require('../../config.json');

// Configuration
const { projectId, pubsub, redisConfig } = config;
const { oddchange, betchange } = pubsub;

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

async function oddChanges() {
  try {
    // Connect to Redis before performing operations (using Promises)
    await redisClient.connect();

    // Create a subscription object for odds changes
    const subscription = pubSubClient.subscription(oddchange.subscription);

    // Listen for messages on the subscription
    subscription.on('message', async message => {
      const data = JSON.parse(message.data);
      console.log(`Received odds change message: ${JSON.stringify(data)}`);

      try {
        // Fetch all keys matching the pattern of bets associated with these odds
        const pattern = `${data.compositeId}*`;
        const keys = await redisClient.keys(pattern);

        // Update the odds for each bet
        for (const key of keys) {
          const value = await redisClient.get(key);
          const betData = JSON.parse(value);
          // Update the odds in the bet data
          betData.betOdd = data.latestOdds;

          // Store the updated bet data back in Redis
          //await redisClient.set(key, JSON.stringify(betData));
          console.log(`Updated odds ${betData.betOdd}, ${betData.likelihood}, ${betData.algorithm}, for bet ${betData.compositeId} in Redis.`);

          // Fan Out the bet changes to fan out topic
          const betChange = {
            compositeId: betData.compositeId,
            likelihood: betData.likelihood,
            latestOdds: betData.betOdd,
            algorithm: betData.algorithm
          };

          await publishMessage(betchange.topic, betChange);
          
        }
      } catch (error) {
        console.error('Error updating odds in Redis:', error);
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
oddChanges();





