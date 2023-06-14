# E-Commerce Services Example using AWS Lambda & kinesis

This is a sample application that demonstrates the communication between two Lambda services using AWS Kinesis. The Order Service receives HTTP POST requests to create new orders, and it produces events to a Kinesis stream. The Product Service consumes the events and updates the product quantity in a DynamoDB table.

## Prerequisites

- Docker and Docker Compose are installed.
- AWS CLI is installed (for creating the Kinesis stream).
- Serverless Framework is installed globally (`npm install -g serverless`).

## Setup

1. Clone the repository and navigate to the project directory.

2. Start LocalStack using Docker Compose to emulate AWS services locally:

```bash 
docker-compose up -d
```
3. Create a new Kinesis stream named "my-stream" using the AWS CLI:
```bash 
aws --endpoint-url=http://localhost:4566 kinesis create-stream --stream-name my-stream --shard-count 1
```

## Order Service

### Starting the Order Service

1. Install dependencies for the Order Service:
```bash
cd order-service
yarn install
```

2. Run the Order Service locally using Serverless Offline:
```bash
sls offline
```

### Creating a New Order

To create a new order, send an HTTP POST request to the `/order` endpoint:

```bash
curl -X POST -H "Content-Type: application/json" -d '{
"orderId": "1",
"productId": "1",
"quantity": 1
}' http://localhost:3005/dev/order
```

## Checking Kinesis Stream Records

To check if Kinesis has received the data, follow these steps:

1. List the shards of the Kinesis stream using the AWS CLI:
```bash
aws --endpoint-url=http://localhost:4566 kinesis describe-stream --stream-name my-stream
```

2. Note the shard ID of the shard you want to read records from.

3. Get a shard iterator for the shard using the AWS CLI:
```bash
aws --endpoint-url=http://localhost:4566 kinesis get-shard-iterator --stream-name my-stream --shard-id shard-id --shard-iterator-type TRIM_HORIZON
```

4. Note the ShardIterator value.

5. Read records from the Kinesis stream using the shard iterator:
```bash
aws --endpoint-url=http://localhost:4566 kinesis get-records --shard-iterator shard-iterator-value
```

## Product Service

### Starting the Product Service

1. Install dependencies for the Product Service:
```bash
cd product-service
yarn install
```

2. Invoke the Product Service function locally using Serverless:
```bash
sls invoke local -f product-service
```

By following these steps, you should be able to run the Order-Product Service app locally and observe the communication between the services using AWS Kinesis.

