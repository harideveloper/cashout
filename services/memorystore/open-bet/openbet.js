const { PubSub } = require('@google-cloud/pubsub');
const redis = require('redis');
const config = require('../../config.json');

// Configuration
const { projectId, pubsub, redisConfig } = config;
const { openbet } = pubsub;

// Create a Pub/Sub client
const pubSubClient = new PubSub({ projectId });

// Create a Redis client
const redisClient = redis.createClient({
  host: redisConfig.host,  // Redis forwarder VM external IP
  port: redisConfig.port,
});


async function openBets() {
  try {
    // Connect to Redis before storing data (using Promises)
    await redisClient.connect();

    // Create a subscription object
    const subscription = pubSubClient.subscription(openbet.subscription);

    // Listen for messages on the subscription
    subscription.on('message', async message => {
      const data = JSON.parse(message.data);
      console.log(`Received open bet message: ${JSON.stringify(data)}`);

      try {
        // Create a key using message ID (example)
        const key = `${data.compositeId}`;
        const value = JSON.stringify(data);
        await redisClient.set(key, value);
        console.log(`Bet ${data.compositeId} stored to Redis :.`);
      } catch (error) {
        console.error('Error storing open bet data in Redis:', error);
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

openBets();





