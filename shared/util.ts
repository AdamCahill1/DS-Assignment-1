import { marshall } from "@aws-sdk/util-dynamodb";
import { Vehicles } from "../shared/types";

type Entity = Vehicles; 
export const generateItem = (entity: Entity) => {
  return {
    PutRequest: {
      Item: marshall(entity),
    },
  };
};

export const generateBatch = (data: Entity[]) => {
  return data.map((e) => {
    return generateItem(e);
  });
};