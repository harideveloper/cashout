
const redis = require('redis');
const config = require('../../config.json');

// Configuration
const { projectId, redisConfig } = config;

// Create a Redis client
const redisClient = redis.createClient({
  host: redisConfig.host,  // Redis forwarder VM external IP
  port: redisConfig.port,
});


async function checkAllBets() {
    try {
      // Connect to Redis before fetching data (using Promises)
      await redisClient.connect();
  
      // Define the pattern to match all open_bet keys
      const pattern = 'GrandNational:FlyingFox:ToWin:*';
  
      // Fetch all keys matching the pattern
      const keys = await redisClient.keys(pattern);
  
      // Iterate through each key and fetch its value (bet data)
      for (const key of keys) {
        const value = await redisClient.get(key);
        const betData = JSON.parse(value);
  
        // Process each bet data (you can log it or perform other operations)
        console.log(`Found bet in Redis: Bet ID ${betData.compositeId}, Data:`, betData);
      }
  
      console.log(`Checked all bets in Redis. Total bets: ${keys.length}`);
    } catch (error) {
      console.error('Error checking bets in Redis:', error);
    } finally {
      // Close the Redis connection
      redisClient.quit();
    }
  }
  

  checkAllBets();