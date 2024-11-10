import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

import Ajv from "ajv";
import schema from "../shared/types.schema.json";
import {
  CookieMap,
  createPolicy,
  JwtToken,
  parseCookies,
  verifyToken,
} from "./utils";

const ajv = new Ajv();
const isValidBodyParams = ajv.compile(schema.definitions["VehicleFaults"] || {});

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event: any) => {
  try {
    console.log("[EVENT]", JSON.stringify(event));
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

   
  
    const body = event.body ? JSON.parse(event.body) : undefined;
    if (!body) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Missing request body" }),
      };
    };


    if (!isValidBodyParams(body)) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: `Incorrect type. Must match Vehicle Fault schema`,
          schema: schema.definitions["VehicleFaults"],
        }),
      };
    };

    const getVehcommandOutput = await ddbDocClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: { id: body.vehicleId },
      })
    );

    if (!getVehcommandOutput.Item) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Invalid Vehicle Id. Does not exist in the database" }),
      };
    };  

    const vehicleFaultItem = {
      ...body,
      userId: verifiedJwt ? verifiedJwt.sub!.toString() : "",  
    };


    const commandOutput = await ddbDocClient.send(
      new PutCommand({
        TableName: process.env.FAULTS_TABLE_NAME,
        Item: vehicleFaultItem,
      })
    );

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ message: "Vehicle Fault Added", faultCode: body.faultCode }),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error: "An error occurred while adding the Vehicle Fault" }),
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
