import * as cdk from "aws-cdk-lib";
import { Aws } from "aws-cdk-lib";
import { Construct } from "constructs";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as node from "aws-cdk-lib/aws-lambda-nodejs";

import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";


import { vehicles, vehicleFaults } from "../seed/vehicles";
import { generateBatch } from "../shared/util";


//Add translation
//add option to getFaults
//addFaults
//deleteFaults



export class AuthAppStack extends cdk.Stack {
  private auth: apig.IResource;
  private userPoolId: string;
  private userPoolClientId: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const userPool = new UserPool(this, "UserPool", {
      signInAliases: { username: true, email: true },
      selfSignUpEnabled: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.userPoolId = userPool.userPoolId;

    const appClient = userPool.addClient("AppClient", {
      authFlows: { userPassword: true },
    });

    this.userPoolClientId = appClient.userPoolClientId;

    const authApi = new apig.RestApi(this, "AuthServiceApi", {
      description: "Authentication Service RestApi",
      endpointTypes: [apig.EndpointType.REGIONAL],
      defaultCorsPreflightOptions: {
        allowOrigins: apig.Cors.ALL_ORIGINS,
      },
    });

    this.auth = authApi.root.addResource("auth");

    this.addAuthRoute(
      "signup",
      "POST",
      "SignupFn",
      'signup.ts'
    );

    this.addAuthRoute(
      "confirm_signup",
      "POST",
      "ConfirmFn",
      "confirm-signup.ts"
    );

    this.addAuthRoute('signout', 'GET', 'SignoutFn', 'signout.ts');
    this.addAuthRoute('signin', 'POST', 'SigninFn', 'signin.ts');


    const vehiclesTable = new dynamodb.Table(this, "VehiclesTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "id", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Vehicles",
    });

    const vehicleFaultsTable = new dynamodb.Table(this, "VehicleFaultsTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "vehicleId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "faultCode", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "VehicleFaults",
    });

    vehicleFaultsTable.addLocalSecondaryIndex({
      indexName: "faultNameIx",
      sortKey: { name: "faultName", type: dynamodb.AttributeType.STRING },
    }); 

    const appApi = new apig.RestApi(this, "AppApi", {
      description: "App RestApi",
      endpointTypes: [apig.EndpointType.REGIONAL],
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "X-Amz-Date"],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: apig.Cors.ALL_ORIGINS,
      },
    });

    const appCommonFnProps = {
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "handler",
      environment: {
        TABLE_NAME: vehiclesTable.tableName,
        FAULTS_TABLE_NAME: vehicleFaultsTable.tableName,
        USER_POOL_ID: this.userPoolId,
        CLIENT_ID: this.userPoolClientId,
        REGION: cdk.Aws.REGION,
      },
    };

    //Functions
    const authorizerFn = new node.NodejsFunction(this, "AuthorizerFn", {
      ...appCommonFnProps,
      entry: "./lambda/auth/authorizer.ts",
    });

    const newVehiclesFn = new node.NodejsFunction(this, "AddVehicleFn", {
      ...appCommonFnProps,
      entry: "./lambda/addVehicle.ts",
    });

    const getAllVehicleFn = new node.NodejsFunction(this, "GetAllVehicleFn", {
      ...appCommonFnProps,
      entry: "./lambda/getAllVehicles.ts",
    });

    const getVehicleByIdFn = new node.NodejsFunction(this, "GetVehicleByIdFn", {
      ...appCommonFnProps,
      entry: "./lambda/getVehicleById.ts",
    });

    const updateVehicleByIdFn = new node.NodejsFunction(this, "UpdateVehicleByIdFn", {
      ...appCommonFnProps,
      entry: "./lambda/updateVehicleById.ts",
    });

    const deleteVehicleByIdFn = new node.NodejsFunction(this, "DeleteVehicleByIdFn", {
      ...appCommonFnProps,
      entry: "./lambda/deleteVehicleById.ts",
    });

    const getVehicleFaultsFn = new node.NodejsFunction(this, "GetVehicleFaultsFn", {
      ...appCommonFnProps,
      entry: "./lambda/getVehicleFaults.ts",
    });

    const deleteFaultCodeFn = new node.NodejsFunction(this, "DeleteFaultCodeFn", {
      ...appCommonFnProps,
      entry: "./lambda/deleteFaultCode.ts",
    });

    const addVehicleFaultFn = new node.NodejsFunction(this, "AddVehicleFaultFn", {
      ...appCommonFnProps,
      entry: "./lambda/addVehicleFault.ts",
    });

    const requestAuthorizer = new apig.RequestAuthorizer(
      this,
      "RequestAuthorizer",
      {
        identitySources: [apig.IdentitySource.header("cookie")],
        handler: authorizerFn,
        resultsCacheTtl: cdk.Duration.minutes(0),
      }
    );


    new custom.AwsCustomResource(this, "vehiclesddbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [vehiclesTable.tableName]: generateBatch(vehicles),
            [vehicleFaultsTable.tableName]: generateBatch(vehicleFaults),  
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("vehiclesddbInitData"), 
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [vehiclesTable.tableArn, vehicleFaultsTable.tableArn],  
      }),
    });

    
    vehiclesTable.grantReadWriteData(newVehiclesFn)
    vehiclesTable.grantReadWriteData(updateVehicleByIdFn)
    vehiclesTable.grantReadWriteData(deleteVehicleByIdFn)
    vehiclesTable.grantReadWriteData(getAllVehicleFn)
    vehiclesTable.grantReadWriteData(getVehicleByIdFn)
    vehiclesTable.grantReadData(addVehicleFaultFn)
    
    vehicleFaultsTable.grantReadData(getVehicleFaultsFn)
    vehicleFaultsTable.grantReadWriteData(deleteFaultCodeFn)
    vehicleFaultsTable.grantReadWriteData(addVehicleFaultFn)

    getVehicleByIdFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ["translate:TranslateText"],
      resources: ["*"],
    }));
    getAllVehicleFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ["translate:TranslateText"],
      resources: ["*"],
    }));

    const vehiclesEndpoint = appApi.root.addResource("vehicle");
    vehiclesEndpoint.addMethod("POST", new apig.LambdaIntegration(newVehiclesFn, { proxy: true }), {
      authorizer: requestAuthorizer,
      authorizationType: apig.AuthorizationType.CUSTOM,
    });
    vehiclesEndpoint.addMethod("GET", new apig.LambdaIntegration(getAllVehicleFn, { proxy: true }));


    const vehicleEndpoint = vehiclesEndpoint.addResource("{vehicleId}");
    vehicleEndpoint.addMethod("GET", new apig.LambdaIntegration(getVehicleByIdFn, { proxy: true }));  
    vehicleEndpoint.addMethod("PUT", new apig.LambdaIntegration(updateVehicleByIdFn, { proxy: true }), {
      authorizer: requestAuthorizer,
      authorizationType: apig.AuthorizationType.CUSTOM,
    });
    vehicleEndpoint.addMethod("DELETE", new apig.LambdaIntegration(deleteVehicleByIdFn, { proxy: true }), {
      authorizer: requestAuthorizer,
      authorizationType: apig.AuthorizationType.CUSTOM,
    });

    
    const vehicleFaultsEndpoint = vehiclesEndpoint.addResource("faults");
    vehicleFaultsEndpoint.addMethod("GET", new apig.LambdaIntegration(getVehicleFaultsFn, { proxy: true }));  
    vehicleFaultsEndpoint.addMethod("DELETE", new apig.LambdaIntegration(deleteFaultCodeFn, { proxy: true }), {
      authorizer: requestAuthorizer,
      authorizationType: apig.AuthorizationType.CUSTOM,
    });
    vehicleFaultsEndpoint.addMethod("POST", new apig.LambdaIntegration(addVehicleFaultFn, { proxy: true }), {
      authorizer: requestAuthorizer,
      authorizationType: apig.AuthorizationType.CUSTOM,
    });
  }

  private addAuthRoute(
    resourceName: string,
    method: string,
    fnName: string,
    fnEntry: string,
    allowCognitoAccess?: boolean
  ): void {
    const commonFnProps = {
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "handler",
      environment: {
        USER_POOL_ID: this.userPoolId,
        CLIENT_ID: this.userPoolClientId,
        REGION: cdk.Aws.REGION
      },
    };
    
    const resource = this.auth.addResource(resourceName);
    
    const fn = new node.NodejsFunction(this, fnName, {
      ...commonFnProps,
      entry: `${__dirname}/../lambda/auth/${fnEntry}`,
    });

    resource.addMethod(method, new apig.LambdaIntegration(fn));
  }










}
