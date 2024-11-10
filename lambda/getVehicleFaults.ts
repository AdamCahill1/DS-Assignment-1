import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { VehicleFaultsQueryParams } from "../shared/types";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";

const ajv = new Ajv();
const isValidQueryParams = ajv.compile(
  schema.definitions["VehicleFaultsQueryParams"] || {}
);
 
const ddbDocClient = createDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("[EVENT]", JSON.stringify(event));
    const queryParams = event.queryStringParameters;
    if (!queryParams) {
      return {
        statusCode: 500,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Missing query parameters" }),
      };
    }
    if (!isValidQueryParams(queryParams)) {
      return {
        statusCode: 500,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: `Incorrect type. Must match Query parameters schema`,
          schema: schema.definitions["VehicleFaultsQueryParams"],
        }),
      };
    }
    
    const vehicleId = parseInt(queryParams.vehicleId);
    let commandInput: QueryCommandInput = {
      TableName: process.env.FAULTS_TABLE_NAME,
    };
    if ("faultName" in queryParams) {
      commandInput = {
        ...commandInput,
        IndexName: "faultNameIx",
        KeyConditionExpression: "vehicleId = :v and begins_with(faultName, :f) ",
        ExpressionAttributeValues: {
          ":v": vehicleId,
          ":f": queryParams.faultName,
        },
      };
    } else if ("faultCode" in queryParams) {
      const faultCodePrefix = queryParams.faultCode;
      const faultCodePrefixLength = faultCodePrefix.length;
    
      commandInput = {
        ...commandInput,
        KeyConditionExpression: "vehicleId = :v and faultCode BETWEEN :min AND :max",
        ExpressionAttributeValues: {
          ":v": vehicleId,
          ":min": parseInt(faultCodePrefix),
          ":max": parseInt(faultCodePrefix.padEnd(faultCodePrefixLength + (6 - faultCodePrefixLength), '9')),
        },
      };
    } else {
      commandInput = {
        ...commandInput,
        KeyConditionExpression: "vehicleId = :v",
        ExpressionAttributeValues: {
          ":v": vehicleId,
        },
      };
    }
    
      const commandOutput = await ddbDocClient.send(
      new QueryCommand(commandInput)
      );
      
      if (!commandOutput.Items || commandOutput.Items.length === 0) {
        return {
          statusCode: 404,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ Message: "Invalid Vehicle Id or Fault Code. Does not exist in the database" }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          data: commandOutput.Items,
        }),
      };
    } catch (error: any) {
      console.log(JSON.stringify(error));
      return {
        statusCode: 500,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ error }),
      };
    }
  };
  
  function createDocumentClient() {
    const ddbClient = new DynamoDBClient({ region: process.env.REGION });
    const marshallOptions = {
      convertEmptyValues: true,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    };
    const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}