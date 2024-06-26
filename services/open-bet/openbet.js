const { Spanner } = require('@google-cloud/spanner');
const { PubSub } = require('@google-cloud/pubsub');
const config = require('./../config.json');

// Configuration
const { projectId, spanner, pubsub } = config;
const { instanceId, databaseId } = spanner;
const { openbet } = pubsub;

// Create a Spanner client
const spannerClient = new Spanner({ projectId });
const instance = spannerClient.instance(instanceId);
const database = instance.database(databaseId);

// Create a Pub/Sub client
const pubSubClient = new PubSub({ projectId });

// Function to handle incoming messages from Pub/Sub
async function handleBet(message) {
    try {
        // Parse the incoming message
        const betData = JSON.parse(message.data.toString());
        console.log('Received new bet:', betData);

        // Convert amount and odds to Spanner float
        const amount = Spanner.float(betData.amount);
        const odds = Spanner.float(betData.odds);

        // Insert the bet into Spanner
        const query = {
            sql: `INSERT INTO Bets (BetID, UserID, EventID, Amount, Odds, Status, Timestamp) 
                  VALUES (@BetID, @UserID, @EventID, @Amount, @Odds, @Status, PENDING_COMMIT_TIMESTAMP())`,
            params: {
                BetID: betData.betID,
                UserID: betData.userID,
                EventID: betData.eventID,
                Amount: amount,
                Odds: odds,
                Status: betData.status,
            },
        };

        // Run the transaction in Spanner
        await database.runTransactionAsync(async (transaction) => {
            try {
                await transaction.runUpdate(query);
                await transaction.commit(); // Commit transaction if successful
                console.log(`New Bet inserted with BetID ${betData.betID}.`);

                // Acknowledge the message only after successful insertion
                message.ack();
            } catch (err) {
                console.error('Error updating bet:', err);
                await transaction.rollback();
                // If there's an error, nacknowledge (nack) the message to retry
                message.nack();
            }
        });
    } catch (error) {
        console.error('Error processing message:', error);
        // Nacknowledge (nack) the message to indicate failure, so Pub/Sub can retry
        message.nack();
    }
}

// Subscribe to the Pub/Sub subscription to receive messages
const subscription = pubSubClient.subscription(openbet.subscription);
subscription.on('message', handleBet);

// Close the Spanner database when finished
process.on('SIGINT', () => {
    database.close();
    console.log('Closed Spanner database connection.');
    process.exit();
});

