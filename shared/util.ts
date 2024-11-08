import { marshall } from "@aws-sdk/util-dynamodb";
import { Vehicles, VehicleFaults } from "../shared/types";

type Entity = Vehicles | VehicleFaults; 
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