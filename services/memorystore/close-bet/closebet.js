const { PubSub } = require('@google-cloud/pubsub');
const redis = require('redis');
const config = require('../../config.json');

// Configuration
const { projectId, pubsub, redisConfig } = config;
const { closebet } = pubsub;

// Create a Pub/Sub client
const pubSubClient = new PubSub({ projectId });

// Create a Redis client
const redisClient = redis.createClient({
  host: redisConfig.host,  // Redis forwarder VM external IP
  port: redisConfig.port,
});

async function closeBets() {
  try {
    // Connect to Redis before storing data (using Promises)
    await redisClient.connect();

    // Create a subscription object for closing bets
    const subscription = pubSubClient.subscription(closebet.subscription);

    // Listen for messages on the subscription
    subscription.on('message', async message => {
      const data = JSON.parse(message.data);
      console.log(`Received bet close message: ${JSON.stringify(data)}`);

      try {
        // Delete the bet from Redis based on the betID
        const key = `${data.compositeId}`;

        // Check if the key exists in Redis before attempting to delete
        const exists = await redisClient.exists(key);

        if (exists === 1) {
          await redisClient.del(key);
          console.log(`Bet ${data.compositeId} closed , deleted from Redis`);
        } else {
          console.log(`Bet ${data.compositeId} not found in Redis.`);
        }
      } catch (error) {
        console.error('Error deleting close bet data from Redis:', error);
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

closeBets();





