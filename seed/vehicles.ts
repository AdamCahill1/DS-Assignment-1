import {Vehicles, VehicleFaults} from '../shared/types'

export const vehicles : Vehicles[] = [
  {
    id: 848326,
    make: 'Volkswagen',
    model: 'cc',
    year: 2015,
    mileage: 183000,
    about: 'The Volkswagen cc is a facelift of the older Volkswagen passat cc. It was manufacutred from 2012 to 2017. It is a coupe with 4 doors. It is also equiped with a modern comfy interior.'
  },
  {
    id: 418422,
    make: 'Volkswagen',
    model: 'golf',
    year: 2014,
    mileage: 150000,
    about: 'The Volkswagen golf is very popular hatchback across europe. It can be bought in either a  4 door or a 2 door. The golf is also known for its sporty lucks with some varients coming with high performance engines.'
  },
  {
    id: 987654,
    make: "Toyota",
    model: "corolla",
    year: 2016,
    mileage: 92000,
    about: "The Toyota Corolla is one of the best-selling compact saloon worldwide, known for its reliability and fuel efficiency. This 2016 model has a spacious interior and advanced safety features.",
  },
  {
    id: 123456,
    make: "Honda",
    model: "civic",
    year: 2018,
    mileage: 78000,
    about: "The Honda Civic is a versatile saloon with a sleek design, offering excellent fuel economy and performance. Known for its durability, this 2018 model has advanced infotainment and safety systems.",
  },
  {
    id: 112233,
    make: "Ford",
    model: "focus",
    year: 2013,
    mileage: 110000,
    about: "The Ford Focus is a compact car known for its agile handling and modern design. The 2013 model comes with an efficient engine, making it suitable for both city and motorway driving.",
  },
  {
    id: 332211,
    make: "BMW",
    model: "3 series",
    year: 2017,
    mileage: 85000,
    about: "The BMW 3 Series is a luxury saloon that combines sporty performance with a comfortable interior. This 2017 model features premium materials, precise handling, and impressive acceleration.",
  },
  {
    id: 445566,
    make: "Audi",
    model: "A4",
    year: 2019,
    mileage: 67000,
    about: "The Audi A4 is a compact executive car known for its luxury, technology, and smooth driving experience. The 2019 model features a high-quality interior and a powerful yet fuel-efficient engine.",
  },
]


export const vehicleFaults: VehicleFaults[] = [
  {
    vehicleId: 848326,
    faultName: "Wheel-Speed-Sensor",
    faultCode: 108203,
    faultMessage: "Back right wheel speed sensor not sending data.",
  },
  {
    vehicleId: 848326,
    faultName: "Engine-Overheat",
    faultCode: 200301,
    faultMessage: "Engine temperature is exceeding the normal threshold.",
  },
  {
    vehicleId: 848326,
    faultName: "Low-Oil-Pressure",
    faultCode: 302101,
    faultMessage: "Oil pressure is below the recommended level.",
  },
  {
    vehicleId: 987654,
    faultName: "Battery-Voltage-Low",
    faultCode: 401502,
    faultMessage: "Battery voltage is below the minimum required value.",
  },
  {
    vehicleId: 987654,
    faultName: "Transmission-Slip",
    faultCode: 502304,
    faultMessage: "Transmission is slipping between gears.",
  },
  {
    vehicleId: 987654,
    faultName: "Brake-Fluid-Low",
    faultCode: 600201,
    faultMessage: "Brake fluid level is below minimum threshold.",
  },
  {
    vehicleId: 123456,
    faultName: "ABS-Module-Failure",
    faultCode: 705101,
    faultMessage: "Anti-lock braking system module is not responding.",
  },
  {
    vehicleId: 123456,
    faultName: "Fuel-Pump-Failure",
    faultCode: 804203,
    faultMessage: "Fuel pump not delivering adequate fuel pressure.",
  },
  {
    vehicleId: 112233,
    faultName: "Exhaust-Gas-Recirculation",
    faultCode: 900304,
    faultMessage: "EGR valve is malfunctioning, affecting emissions control.",
  },
  {
    vehicleId: 112233,
    faultName: "Oxygen-Sensor-Failure",
    faultCode: 1001205,
    faultMessage: "Oxygen sensor readings are out of range, affecting fuel mixture.",
  },
  {
    vehicleId: 332211,
    faultName: "Catalytic-Converter-Efficiency",
    faultCode: 1101406,
    faultMessage: "Catalytic converter efficiency below threshold.",
  },
  {
    vehicleId: 332211,
    faultName: "Turbocharger-Overboost",
    faultCode: 1201807,
    faultMessage: "Turbocharger is producing excessive boost pressure.",
  },
  {
    vehicleId: 332211,
    faultName: "Knock-Sensor-Failure",
    faultCode: 1302508,
    faultMessage: "Knock sensor not responding, potential engine knock undetected.",
  },
  {
    vehicleId: 112233,
    faultName: "Throttle-Position-Sensor",
    faultCode: 1403109,
    faultMessage: "Throttle position sensor output is erratic.",
  },
  {
    vehicleId: 123456,
    faultName: "Steering-Angle-Sensor",
    faultCode: 1503610,
    faultMessage: "Steering angle sensor misalignment detected.",
  },
];
