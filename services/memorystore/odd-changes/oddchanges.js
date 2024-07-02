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
const pubsubSubscription = validate(process.env.SUBSCRIPTION_ODD_CHANGE, 'SUBSCRIPTION_ODD_CHANGE');
const redisHost = validate(process.env.REDIS_HOST, 'REDIS_HOST');
const redisPort = validate(process.env.REDIS_PORT, 'REDIS_PORT');
const betChangeTopic = validate(process.env.TOPIC_BET_CHANGE, 'TOPIC_BET_CHANGE');


// Create a Pub/Sub client
const pubSubClient = new PubSub({ projectId });

// Create a Redis client
const redisClient = redis.createClient({
  host: redisHost, 
  port: redisPort,
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
    const subscription = pubSubClient.subscription(pubsubSubscription);

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

          await publishMessage(betChangeTopic, betChange);
          
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





