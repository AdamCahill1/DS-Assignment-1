import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { CookieMap, JwtToken, parseCookies, verifyToken } from "./utils";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event: any) => {
  try {
    console.log("[EVENT]", JSON.stringify(event));

    const queryParams = event.queryStringParameters;
    const vehicleId = queryParams?.vehicleId ? parseInt(queryParams.vehicleId) : undefined;
    const faultCode = queryParams?.faultCode ? parseInt(queryParams.faultCode) : undefined;

    if (!vehicleId || !faultCode) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Missing vehicleId or faultCode in query parameters" }),
      };
    }

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

    const userId = verifiedJwt ? verifiedJwt.sub!.toString() : "";


    const getCommandOutput = await ddbDocClient.send(
      new GetCommand({
        TableName: process.env.FAULTS_TABLE_NAME, 
        Key: { vehicleId, faultCode }, 
      })
    );

    console.log("GetCommand response: ", getCommandOutput);
    if (!getCommandOutput.Item) {
      return {
        statusCode: 404,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Invalid vehicleId or faultCode. Item does not exist." }),
      };
    }


    const ownerUserId = getCommandOutput.Item.userId;
    if (ownerUserId !== userId) {
      return {
        statusCode: 403,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "You are not the owner of this item and cannot delete it." }),
      };
    }

 
    const deleteCommandOutput = await ddbDocClient.send(
      new DeleteCommand({
        TableName: process.env.FAULTS_TABLE_NAME,
        Key: { vehicleId, faultCode },
        ReturnValues: "ALL_OLD", 
      })
    );

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: deleteCommandOutput.Attributes }),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
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
