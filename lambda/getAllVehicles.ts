import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";

const ddbDocClient = createDDbDocClient();
const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const translateClient = new TranslateClient({ region: process.env.REGION });

export const handler: APIGatewayProxyHandlerV2 = async (event: any) => {
  try {
    console.log("Event: ", event);

    const language = event.queryStringParameters?.language;

    const commandOutput = await ddbDocClient.send(
      new ScanCommand({
        TableName: process.env.TABLE_NAME,
      })
    );
    if (!commandOutput.Items) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "No vehicels found in the database" }),
      };
    }

    const items = commandOutput.Items;

    const processedItems = await Promise.all(
      items.map(async (item) => {
        if (language) {
          if (item.translations && item.translations[language]?.about) {
            item.about = item.translations[language].about;
          } else {
            const translateCommand = new TranslateTextCommand({
              Text: item.about,
              SourceLanguageCode: "en",
              TargetLanguageCode: language,
            });
            const translateResult = await translateClient.send(translateCommand);
            const translatedText = translateResult.TranslatedText!;

            item.about = translatedText;
            item.translations = item.translations || {};
            item.translations[language] = { about: translatedText };

            if (language !== "en") {
              await ddbDocClient.send(
                new PutCommand({
                  TableName: process.env.TABLE_NAME,
                  Item: item,
                })
              );
            }
          }
        } 
        const { translations, ...responseItem } = item;
        return responseItem;
      })
    );

    if (language) {
      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ data: processedItems }),
      };

    } else {
      const body = {
        data: commandOutput.Items,
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
