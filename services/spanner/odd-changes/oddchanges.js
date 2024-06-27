const { PubSub } = require('@google-cloud/pubsub');
const { Spanner } = require('@google-cloud/spanner');
const config = require('../../config.json')

// Configuration
const { projectId, spanner, pubsub } = config;
const { instanceId, databaseId } = spanner;
const { oddchange, notifyuser } = pubsub;

// Create Spanner and Pub/Sub clients
const spannerClient = new Spanner({ projectId });
const pubSubClient = new PubSub({ projectId });

// Retrieve a Spanner database instance
const instance = spannerClient.instance(instanceId);
const database = instance.database(databaseId);

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

// Function to handle incoming odd change messages
async function handleOddChanges(message) {
  try {
    // Parse incoming message
    const oddChangeData = JSON.parse(message.data.toString());
    console.log('Received odd change:', oddChangeData);

    //Ensure odds is defined and a valid number
    if (typeof oddChangeData.odds !== 'number' || isNaN(oddChangeData.odds)) {
      throw new Error('Received odd change with invalid or undefined odds value.');
    }

    // Type cast odds to Spanner float
    const odds = Spanner.float(oddChangeData.odds);

    // Query Spanner for users impacted by eventID
    const query = {
      sql: `SELECT UserID FROM Bets WHERE EventID = @EventID`,
      params: {
        EventID: oddChangeData.eventID,
      },
    };

    const [rows] = await database.run(query);

    // Process each user to recalculate odds
    for (const row of rows) {
      const { UserID } = row.toJSON();

      if (!UserID) {
        console.error('Found row with undefined UserID:', row);
        continue;
      }

      console.log(`Recalculating odds for user ${UserID}`);

      // Update Spanner with new odds
      const updateUserQuery = {
        sql: `UPDATE Bets SET Odds = @Odds WHERE EventID = @EventID AND UserID = @UserID`,
        params: {
          UserID: UserID,
          EventID: oddChangeData.eventID,
          Odds: odds,
        },
      };

      await database.runTransactionAsync(async (transaction) => {
        await transaction.runUpdate(updateUserQuery);
        await transaction.commit();
        console.log(`Updated odds for user ${UserID}`);
      });

      // Notify the user of the odds change
      const userNotification = {
        userID: UserID,
        eventID: oddChangeData.eventID,
        newOdds: oddChangeData.odds,
        message: `The odds for event ${oddChangeData.eventID} have changed to ${oddChangeData.odds}.`
      };

      await publishMessage(notifyuser.topic, userNotification);
    }

    // Acknowledge the message
    message.ack();
  } catch (error) {
    console.error('Error processing odd change message:', error);
    // Nacknowledge (nack) the message to indicate failure, so Pub/Sub can retry
    message.nack();
  }
}

// Subscribe to the Odd Change topic
const subscription = pubSubClient.subscription(oddchange.subscription);
subscription.on('message', handleOddChanges);

// Close the Spanner database when finished (optional)
process.on('SIGINT', () => {
  database.close();
  console.log('Closed Spanner database connection.');
  process.exit();
});
