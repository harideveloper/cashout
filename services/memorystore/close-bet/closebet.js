require('dotenv').config();

const { PubSub } = require('@google-cloud/pubsub');
const redis = require('redis');


// Validate environment variables
function validate(envVar, envVarName) {
  if (!envVar || envVar.trim() === '') {
    throw new Error(`Environment variable ${envVarName} is missing or empty.`);
  }
  return envVar;
}

// Declare Env Variables
const projectId = validate(process.env.PROJECT_ID, 'PROJECT_ID');
const pubsubSubscription = validate(process.env.SUBSCRIPTION_CLOSE_BET, 'SUBSCRIPTION_CLOSE_BET');
const redisHost = validate(process.env.REDIS_HOST, 'REDIS_HOST');
const redisPort = validate(process.env.REDIS_PORT, 'REDIS_PORT');



// Create a Pub/Sub client
const pubSubClient = new PubSub({ projectId });

// Create a Redis client
const redisClient = redis.createClient({
  host: redisHost, 
  port: redisPort,
});

async function closeBets() {
  try {
    // Connect to Redis before storing data (using Promises)
    await redisClient.connect();

    // Create a subscription object for closing bets
    const subscription = pubSubClient.subscription(pubsubSubscription);

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





