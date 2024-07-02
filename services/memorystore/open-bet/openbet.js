require('dotenv').config();

const { PubSub } = require('@google-cloud/pubsub');
const redis = require('redis');


// Validate environment variables
function validate(envVar, envVarName) {
  console.log(envVar)
  if (!envVar || envVar.trim() === '') {
    throw new Error(`Environment variable ${envVarName} is missing or empty.`);
  }
  return envVar;
}

// Declare Env Variables
const projectId = validate(process.env.PROJECT_ID, 'PROJECT_ID');
const pubsubSubscription = validate(process.env.SUBSCRIPTION_OPEN_BET, 'SUBSCRIPTION_OPEN_BET');
const redisHost = validate(process.env.REDIS_HOST, 'REDIS_HOST');
const redisPort = validate(process.env.REDIS_PORT, 'REDIS_PORT');


// Create a Pub/Sub client
const pubSubClient = new PubSub({ projectId });

// Create a Redis client
const redisClient = redis.createClient({
  host: redisHost, 
  port: redisPort,
});


async function openBets() {
  try {
    // Connect to Redis before storing data (using Promises)
    await redisClient.connect();

    // Create a subscription object
    const subscription = pubSubClient.subscription(pubsubSubscription);

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





