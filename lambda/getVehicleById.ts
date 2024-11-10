import { APIGatewayProxyHandlerV2 } from "aws-lambda";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";

const ddbDocClient = createDDbDocClient();
const translateClient = new TranslateClient({ region: process.env.REGION });

export const handler: APIGatewayProxyHandlerV2 = async (event: any) => {     
  try {
    console.log("[EVENT]", JSON.stringify(event));

    const parameters  = event?.pathParameters;
    const vehicleId = parameters?.vehicleId ? parseInt(parameters.vehicleId) : undefined;
    const language = event.queryStringParameters?.language;

    

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

    let item = commandOutput.Item;

    if (language) {
      if (item.translations && item.translations[language]?.about) {
        item = { ...item, about: item.translations[language].about };
      } else {
        const translateCommand = new TranslateTextCommand({
          Text: item.about,
          SourceLanguageCode: "en",
          TargetLanguageCode: language,
        });
        const translateResult = await translateClient.send(translateCommand);
        const translatedText = translateResult.TranslatedText!;

        item = { ...item, about: translatedText };
        item.translations = item.translations || {};
        item.translations[language] = { about: translatedText };

        if (language !== "en") {
          await ddbDocClient.send(
            new PutCommand({
              TableName: process.env.TABLE_NAME,
              Item: { ...item, about: commandOutput.Item.about }, 
            })
          );
        }
      }

      const { translations, ...responseItem } = item;
      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(responseItem),
      };

    } else {
      const body = {
        data: commandOutput.Item,
      };
      
      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      };
    }
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
