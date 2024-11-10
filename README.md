## Serverless REST Assignment - Distributed Systems.

__Name:__ Adam Cahill

__Demo:__ https://youtu.be/VP5PxiTPPok

### Context.

I chose to simulate an API that is used to store vehicle with also being able to assign vehicle faults to each vehicle. The main vehicle table stores information such as the vehicle make and model, the vehicles mileage and a short description about the vehicle. Each Item (vehcile) is also assigned an ID which is used to help identify each vehicle.

### App API endpoints.

[ Provide a bullet-point list of the app's endpoints (excluding the Auth API) you have successfully implemented. ]
e.g.
 
+ POST /vehicle - add a new 'vehicle'.
+ GET /vehicle - Get all the 'vehicles'. This will show all vehicle along with what languages have been translated.
+ GET /vehicle?language=value - Get all the 'vehicles' and translate them to selected language. When a language is specified it will only display the translated string along with the other values of the Item and the user will not be show the other translations.

+ GET /vehicle/{id}/ - Get a 'vehicle'  via its id number. eg. of one is 848326. This will also return the Item along with what languages it was translated to before.
+ GET /vehicle/{id}?language=value - Get a 'vehicle' via its id number along with the translated string. eg. of one is 848326. When a language is specified it will only display the translated string along with the other values of the Item and the user will not be show the other translations.
+ PUT /vehicle/{id}/ - Update a 'vehicle'  via its id number. Must be a item that the user added
+ DELETE /vehicle/{id}/ - Delete a 'vehicle'  via its id number. Must be a item that the user added


+ GET /vehicle/faults?vehicleId=875432 - Get All fault codes specific to a certain vehicle via vehicleId.
+ GET /vehicle/faults?vehicleId=875432&faultCode=904205 - Get the vehicle fault that belong to a vehicle by using a specific vehicleId along with a faultCode value.
+ GET /vehicle/faults?vehicleId=875432&faultName=Wheel-Speed-Sensor - Get any fault named Wheel-Speed-Sensor that belongs to the specific vehicleId.
+ POST /vehicle/faults - User can add a fault to an existing vehicle only via following the vehicleFaults schema in the body.
+ DELETE /vehicle/faults?vehicleId=value&faultCode=value - Users can delete any faults the added via vehicleId and faultCode. Note both must exist and be created by the user to execute this.


### Update constraint (if relevant).

[Briefly explain your design for the solution to the PUT/Update constraint 
- only the user who added an item to the main table could update it.]

For this project I have desinged it so only users that are fully signed in with a verified account has the option to add items to any of the tables. I have also made it so only the user that created an item in each database has the option to modify the content of that item. I achieved this by adding the users id to the item once they create it which is then used to verify if a user can edit or delete an item when they make the request by matching it with the there currecnt userId with the one saved to the Item.

Any request that involves requesting information (GET) is fully public and anyone with or without a account can make a GET request to view all Items in each table.

### Translation persistence (if relevant).

[Briefly explain your design for the solution to avoid repeat requests to Amazon Translate - persist translations so that Amazon Translate can be bypassed for repeat translation requests.]

I added translaion to the "about" value of the Vehicles table as this is quite a long string. A user is able to either request an individual Item (vehicle) with its id to be translated which will return just that item with the "about" string translated. This translation then is saved to that item under "translation" and each time a user makes a request for a translation it checks this array to see if the language they are requesting already exists. 

The same technique also applies to GET all vehicls. Only this time every Item in the table is translated and returned to the User. This also saves the translation the same exact way as before making sure that translation doesnt happen over and over.

###  Extra (If relevant).

[ State whether you have created a multi-stack solution for this assignment or used lambda layers to speed up update deployments. Also, mention any aspect of the CDK framework __that was not covered in the lectures that you used in this assignment. ]


