const { Spanner } = require('@google-cloud/spanner');
const { PubSub } = require('@google-cloud/pubsub');
const config = require('../../config.json')

// Extract configuration values
const { projectId, spanner, pubsub } = config;
const { instanceId, databaseId } = spanner;
const { closebet } = pubsub;

// Create a Spanner client
const spannerClient = new Spanner({ projectId });
const database = spannerClient.instance(instanceId).database(databaseId);

// Create a Pub/Sub client
const pubSubClient = new PubSub({ projectId });

// Function to handle closing bets
async function handleCloseBet(betData) {
  try {
    // Check if BetID exists in the database
    const existsQuery = {
      sql: `SELECT COUNT(*) AS count FROM Bets WHERE BetID = @betID`,
      params: {
        betID: betData.betID,
      },
    };

    const [queryResult] = await database.run(existsQuery);
    const existsRows = queryResult.map(row => row.toJSON());

    // Log the database check result for debugging purposes
    console.log('Database check result:', existsRows);

    // If BetID does not exist, log an error and acknowledge the message
    if (existsRows.length === 0 || existsRows[0].count === 0) {
      console.error(`Bet with BetID ${betData.betID} not found.`);
      return;
    }

    // Update the bet status to closed in Spanner
    const updateQuery = {
      sql: `UPDATE Bets SET Status = 'closed' WHERE BetID = @betID`,
      params: {
        betID: betData.betID,
      },
    };

    // Run the transaction in Spanner
    await database.runTransactionAsync(async (transaction) => {
      await transaction.runUpdate(updateQuery);
      await transaction.commit();
      console.log(`Updated bet with BetID ${betData.betID} to closed.`);
    });
  } catch (error) {
    console.error('Error handling close bet:', error);
    throw error; // Rethrow error for Pub/Sub message retry
  }
}

// Function to handle incoming messages from Pub/Sub
async function handleMessage(message) {
  try {
    // Parse the incoming message
    const betData = JSON.parse(message.data.toString());
    console.log('Received close bet message:', betData);

    // Handle the close bet operation
    await handleCloseBet(betData);

    // Acknowledge the message after successful processing
    message.ack();
  } catch (error) {
    console.error('Error processing message:', error);
    // Nacknowledge (nack) the message to indicate failure, so Pub/Sub can retry
    message.nack();
  }
}

// Subscribe to the Pub/Sub subscription to receive close bet messages
const subscription = pubSubClient.subscription(closebet.subscription);
subscription.on('message', handleMessage);

// Close the Spanner database connection on SIGINT signal
process.on('SIGINT', () => {
  database.close()
    .then(() => {
      console.log('Closed Spanner database connection.');
      process.exit();
    })
    .catch((err) => {
      console.error('Error closing Spanner database:', err);
      process.exit(1);
    });
});
