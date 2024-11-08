import { APIGatewayProxyHandlerV2 } from "aws-lambda";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand  } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

import {
  CookieMap,
  createPolicy,
  JwtToken,
  parseCookies,
  verifyToken,
} from "./utils";

export const handler: APIGatewayProxyHandlerV2 = async (event: any) => {     
  try {
    console.log("[EVENT]", JSON.stringify(event));

    const parameters  = event?.pathParameters;
    const vehicleId = parameters?.vehicleId ? parseInt(parameters.vehicleId) : undefined;

    const cookies: CookieMap = parseCookies(event);

    if (!cookies) {
      return {
        statusCode: 403,
        body: "Unauthorised request!!",
      };
    }
  
    const verifiedJwt: JwtToken = await verifyToken(
      cookies.token,
      process.env.USER_POOL_ID,
      process.env.REGION!
    );

    if (!vehicleId) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing Vehicle Id" }),
      };
    }

    const commandOutput = await ddbDocClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: { id: vehicleId },
      })
    );
    console.log("GetCommand response: ", commandOutput);
    if (!commandOutput.Item) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Invalid Vehicle Id. Does not exist in the database" }),
      };
    }

    const ownerUserId = commandOutput.Item.userId;
    const userId = verifiedJwt ? verifiedJwt.sub!.toString() : "";

    if (ownerUserId !== userId) {
      return {
        statusCode: 403,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "You are not the owner of this Item and cannot update its values" }),
      };
    }


    const body = event.body ? JSON.parse(event.body) : {};
    if (!body || Object.keys(body).length === 0) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ Message: "Request body is missing or empty" }),
      };
    }

    const updateCommand = new UpdateCommand({
      TableName: process.env.TABLE_NAME,
      Key: { id: vehicleId },
      UpdateExpression: "set " + Object.keys(body).map(key => `#${key} = :${key}`).join(", "),
      ExpressionAttributeValues: Object.fromEntries(Object.entries(body).map(([k, v]) => [`:${k}`, v])),
      ExpressionAttributeNames: Object.fromEntries(Object.keys(body).map(k => [`#${k}`, k])),
      ReturnValues: "ALL_NEW",
    });

    const updateResponse = await ddbDocClient.send(updateCommand);
    console.log("UpdateCommand response: ", updateResponse);

 
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        Message: "Vehicle updated successfully",
        data: updateResponse.Attributes,}),
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

function createDDbDocClient() {
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
