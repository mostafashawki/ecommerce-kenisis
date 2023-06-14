const { KinesisClient, PutRecordCommand } = require("@aws-sdk/client-kinesis");

const kinesisClient = new KinesisClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT });


exports.handler = async (event) => {
  try {
    const orderData = JSON.parse(event.body || "{}");

    // Convert the payload object to Uint8Array
    const encoder = new TextEncoder();
    const payloadBytes = encoder.encode(JSON.stringify(orderData));

    // Produce an event to Kinesis stream
    const res = await kinesisClient.send(
      new PutRecordCommand({
        StreamARN: process.env.STREAM_ARN,
        StreamName: process.env.STREAM_NAME,
        PartitionKey: orderData.orderId,
        Data: payloadBytes,
      })
    );
    console.log('res =========>>>>>>> ', res)

    return {
      statusCode: 200,
      body: "Order service executed successfully",
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: "An error occurred",
    };
  }
};
