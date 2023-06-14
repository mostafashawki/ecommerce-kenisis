const { KinesisClient, GetRecordsCommand, GetShardIteratorCommand } = require("@aws-sdk/client-kinesis");
const { DynamoDBClient, UpdateItemCommand, PutItemCommand, CreateTableCommand } = require("@aws-sdk/client-dynamodb");

const kinesisClient = new KinesisClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT });
const dynamoDBClient = new DynamoDBClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT });
const tableName = process.env.TABLE_NAME;

async function createTable() {
  try {
    const params = {
      AttributeDefinitions: [
        { AttributeName: "productId", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "productId", KeyType: "HASH" },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
      TableName: tableName,
    };

    await dynamoDBClient.send(new CreateTableCommand(params));

    console.log("DynamoDB table created successfully.");
  } catch (error) {
    console.error("Error creating DynamoDB table:", error);
  }
}

async function seedDatabase() {
  // Logic to seed the DynamoDB table with initial product data
  await createTable();
  console.log("Seeding DynamoDB")
  try {
    const params = {
      TableName: tableName,
      Item: {
        productId: { S: "1" },
        quantity: { N: "10" },
      },
    };

    await dynamoDBClient.send(new PutItemCommand(params));

    console.log("Database seeded successfully.");
  } catch (error) {
    console.error("Error seeding the database:", error);
  }
}

async function updateProductQuantity(payload) {
  // Logic to update the DynamoDB table and decrease the quantity of the product
  try {
    const params = {
      TableName: tableName,
      Key: {
        productId: { S: payload.productId },
      },
      UpdateExpression: "SET quantity = quantity - :quantity",
      ExpressionAttributeValues: {
        ":quantity": { N: payload.quantity.toString() },
      },
    };

    await dynamoDBClient.send(new UpdateItemCommand(params));

    console.log("Product quantity updated successfully:", payload.productId);
  } catch (error) {
    console.error("Error updating product quantity:", error);
  }
}

exports.handler = async (event) => {
  try {
    // Retrieve shard iterator to start reading from the beginning of the stream
    const shardIteratorResponse = await kinesisClient.send(
      new GetShardIteratorCommand({
        StreamARN: process.env.STREAM_ARN,
        StreamName: process.env.STREAM_NAME,
        ShardId: "shardId-000000000000",
        ShardIteratorType: "TRIM_HORIZON",
      })
    );

    let shardIterator = shardIteratorResponse.ShardIterator;

    // Call the database seeding function
    await seedDatabase();

    // Continuously read records from the Kinesis stream
    while (true) {
      const recordsResponse = await kinesisClient.send(
        new GetRecordsCommand({
          ShardIterator: shardIterator,
        })
      );

      const records = recordsResponse.Records;

      // Process the received records
      for (const record of records) {
        const payload = JSON.parse(Buffer.from(record.Data).toString("utf-8"));

        // Perform necessary actions with the payload
        console.log("Received payload:", payload);

        // Update the DynamoDB table and decrease the quantity of the product
        await updateProductQuantity(payload);

        // Set the shard iterator to continue reading from the next record
        shardIterator = recordsResponse.NextShardIterator;
      }

      // Sleep for a certain duration before reading the next batch of records
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error(error);
  }
};
