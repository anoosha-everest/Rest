import express, { Request, Response, NextFunction } from 'express';
import {User,Providers,Meters,Readings} from "./models";
import bodyParser from 'body-parser';


const app = express()
const port = 3000

app.use(bodyParser.json());


app.use(express.json());


let users:User[] = [];
const providers:Providers[]=[];
const meters:Meters[]=[];
const readings:Readings[]=[];

declare module 'express' {
    interface Request {
        user?: User; // Optional user property of type User
        isAdmin?: boolean;
    }
}
const admin={
    id:100
};

interface UserDTO {
    id: number;
    username: string;
    email: string;
    fullname: string;
    MeterId?: number;
    provider?: number;
}

const toUserDTO = (user: User): UserDTO => {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        MeterId: user.MeterId,
        provider: user.provider,
    };
};

// Middleware for authenticating the user using a id
const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const id = req.headers['authorization'];

    if (id!=undefined) {
        if (parseInt(id) === admin.id) {
            (req as any).isAdmin = true; // Indicate that the request is from an admin
            return next();
        }
        const user = users.find(u => u.id === parseInt(id));
        if (user) {
            (req as any).user = user; // Attach the user object to req.user
            return next();
        }
    }

    res.status(401).send('Unauthorized');
};

const checkUser = (req: Request, res: Response, next: NextFunction) => {
    if ((req as any).user && (req as any).user.id === parseInt(req.params.id)) {
        return next();
    }
    res.status(403).send('Forbidden');
};
// Apply the authenticate middleware to all routes
// app.use(authenticate);


app.get('/', (req:Request, res:Response) => {
    res.send('Hello World!')
  })

// Return all users
// app.get('/users', (req, res) => {
//     res.send(users); 
// });
//Return all users(admin only)
// Only admins can access /users
// Route for getting paginated users
app.get('/users', authenticate, (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1; // Default to page 1
    const limit = parseInt(req.query.limit as string) || 5; // Default to 5 users per page
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const usersPage = users.slice(startIndex, endIndex).map(toUserDTO);
    res.send({
        page,
        limit,
        totalUsers: users.length,
        users: usersPage
    });
});

// Create a user with attributes username, password, email and fullname
app.post('/users',(req, res) => {
    let user:User = new User(users.length + 1, req.body.username,req.body.password,req.body.email,req.body.fullname);
    users.push(user);
    res.send("User created");
    
});
// In-memory request tracker
const reqTracker: { [key: number]: { count: number; reqTimestamp: number } } = {};

// Rate limiting middleware
const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
    const user_id = req.headers.authorization;
    if (!user_id) {
        return res.status(401).send('Unauthorized');
    }
    const id=parseInt(user_id);
    const currTime = Date.now();
    const mint = 60 * 1000; // 1 minute
    const reqLimit = 10;

    if (!reqTracker[id]) {
        reqTracker[id] = { count: 1, reqTimestamp: currTime };
    } else {
        const sec = currTime - reqTracker[id].reqTimestamp;
        if (sec < mint) {
            reqTracker[id].count++;
            if (reqTracker[id].count > reqLimit) {
                return res.status(429).send('Too many requests');
            }
        } else {
            // Reset counter and timestamp
            reqTracker[id] = { count: 1, reqTimestamp: currTime };
        }
    }
    next();
};

// Apply rate limiter middleware to all routes
app.use(rateLimiter);

// Return a user with parameter id if not exists return message saying `user not found`
// app.get('/users/:id', (req, res) => {
//     const id=parseInt(req.params.id);
//      const user=users.find(item=> item.id==id);
//      if(user){
//         res.send(user); 
//      }
//      else{
//         res.send("user not found");
//      }
//      console.log("id",id);
//      console.log('user',user); 
// });
// Users can only access their own data
app.get('/users/:id',authenticate,checkUser, (req: Request, res: Response) => {
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (user) {
        res.send(toUserDTO(user));
    } else {
        res.status(404).send('User not found');
    }
});


// update user information for given id 
app.put('/users/:id',authenticate, (req, res) => {
    // req.params.id
    const id: number = parseInt(req.params.id); 
    const userToUpdate = users.find(user => user.id === id);
    if (userToUpdate) {
        let ind=users.indexOf(userToUpdate);
        users[ind] = { ...users[ind], ...req.body}
        res.send(`User with ID ${id} updated`);
    } else {
        res.status(404).send(`User with ID ${id} not found`);
    }
});


// delete user for given id
app.delete('/users/:id',authenticate, (req, res) => {
    // req.params.id
    const id: number = parseInt(req.params.id); 
    const index = users.findIndex(user => user.id === id);

    if (index !== -1) {
        users.splice(index, 1);
        res.send(`User with ID ${id} deleted`);
    } else {
        res.status(404).send(`User with ID ${id} not found`);
    }
});


// Return all providers
app.get('/providers', (req, res) => {
    res.send(providers); 
});

// Create a provider with attributes
app.post('/providers', (req, res) => {
    let provider:Providers = new Providers(providers.length + 1, req.body.name,req.body.charge);
    providers.push(provider);
    res.send("Provider created");
    
});

// Return a provider with parameter id if not exists return message saying `provider not found`
app.get('/providers/:id', (req, res) => {
    const id=parseInt(req.params.id);
     const provider=providers.find(item=> item.id==id);
     if(provider){
        res.send(provider); 
     }
     else{
        res.send("provider not found");
     }
     console.log("id",id);
     console.log('user',provider); 
    
});


// update provider information for given id 
app.put('/providers/:id', (req, res) => {
    // req.params.id
    const id = parseInt(req.params.id);
    console.log(req.body);
    let provider = providers.find(provider => provider.id === id);
    if (!provider) {
        res.send("Provider not found" );
        return;
    }
    else{
        let ind=providers.indexOf(provider);
        providers[ind]={...providers[ind],...req.body};
        res.send(`Provider with ID ${id} updated`);
    }
    
});


// delete provider for given id
app.delete('/providers/:id', (req, res) => {
    // req.params.id
    const id: number = parseInt(req.params.id); 
    const index = providers.findIndex(provider => provider.id === id);

    if (index !== -1) {
        providers.splice(index, 1);
        res.send(`Provider with ID ${id} deleted`);
    } else {
        res.status(404).send(`Provider with ID ${id} not found`);
    }
});
app.post('/providers/subscribing/:id', authenticate,(req,res)=>{
    const id:number=parseInt(req.params.id);
    let user=users.find(item=>item.id===id);
    if(!user){
        res.send("User doesnt exist");
        return;
    }
    else{
        let prov_id=parseInt(req.body.id);
        let provider=providers.find(item=>item.id===prov_id);
        if(!provider){
            res.send("provider doesn't exist");
            return;
        }
        else{
            user.provider=prov_id;
            res.json(user);
        }
    }
});

// Return all meter readings
app.get('/providers', (req, res) => {
    res.send(providers); 
});

// update user meterId information for given userId 
app.put('/users/:id', authenticate,(req, res) => {
    // req.params.id
    const id = parseInt(req.params.id);
    console.log(req.body);
    let user = users.find(item => item.id === id);
    if (!user) {
        res.send("user not found" );
        return;
    }
    else{
        let ind=users.indexOf(user);
        users[ind]={...users[ind],...req.body};
        res.send(`User with ID ${id} updated`);
    }
    
});

//get readings of the meter
app.get('/meters/:id/readings',(req,res)=>{
    let meter_id=parseInt(req.params.id);
    let meter=meters.find(item=>item.MeterId===meter_id)
    if(meter){
        res.send(meter.readings);
    }
    else{
        res.send("meter doesn't exist");
    }
});
//get meter
app.get('/meters', (req, res) => {
    
    res.send(meters);
    
});

// Create a meter
app.post('/meters',(req, res) => {
    let meter:Meters = new Meters(req.body.MeterId, req.body.name,[]);
    meters.push(meter);
    res.send("meter created");
    
});
//create readings for a given meter id
app.post('/meters/:id/readings', (req, res) => {
    let meter_id=parseInt(req.params.id);
    let units=req.body.units;
    let date=req.body.date;
    let read:Readings={
        units:units,
        date:date
    }
    let meter=meters.find(item=>item.MeterId===meter_id)
    if(meter){
        meter.readings.push(read);
        meter.readings=[...meter.readings,...readings];
        res.send(meter);
    }
    else{
        res.send("meter doesn't exist");
        return;
    }
    
});

//API to return all readings of given user id
app.get('/meters/:id',authenticate,checkUser,(req,res)=>{
    let userId=parseInt(req.params.id);
    let user=users.find(item=>item.id===userId);
    if(user){
        let meterid=user.MeterId;
        let meter=meters.find(item=>item.MeterId===meterid);
        if(meter){
            res.send(meter.readings);
        }
        else{
            res.send("meter doesn't exist for that user");
        }
    }
    
});

//API to return bill for given user id
app.get('/users/bill/:id',authenticate,checkUser,(req,res)=>{
    let user_id=parseInt(req.params.id);
    let user=users.find(item=>item.id===user_id);
    if(user){
        let prov_id=(user.provider!=undefined?user.provider:-1);
        let meterId=user.MeterId;
        let meter=meters.find(item=>item.MeterId===meterId);
        if(meter){
            const readingsBillingCycle = ReadingsForBillingCycle(meter.readings);
            const totalUnits = readingsBillingCycle.reduce((sum, reading) => sum + reading.units, 0);
            if(prov_id){
                let pro=providers.find(item=>item.id===prov_id);
                if(pro){
                    let charge=pro.charge;
                    let amt=charge*totalUnits;
                    console.log(amt);
                    let bill={
                        user_id:user_id,
                        amount:amt
                    }
                    res.send(bill);
                }
                else{
                    return res.status(404).send('Meter not found');
                }
            }
            else{
                res.send("provider doesn't exist");
            }
        }
    }
    else{
        return res.status(404).send('User not found');
    }
    
});

// Function to filter readings by date
const filterReadingsByDate = (readings: Readings[], days: number): Readings[] => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return readings.filter(reading => new Date(reading.date) >= startDate);
};

// Route to get past consumed units for a specified number of days
app.get('/users/:id/consumption',authenticate,checkUser, (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    const days = parseInt(req.query.days as string);

    const user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).send('User not found');
    }

    const meter = meters.find(m => m.MeterId === user.MeterId);
    if (!meter) {
        return res.status(404).send('Meter not found');
    }

    const filteredReadings = filterReadingsByDate(meter.readings, days);
    const totalUnits = filteredReadings.reduce((sum, reading) => sum + reading.units, 0);
    res.send({ totalUnits });
});


// Utility function to get readings for current billing cycle
const ReadingsForBillingCycle = (readings: Readings[]): Readings[] => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return readings.filter(reading => {
        const readingDate = new Date(reading.date);
        return readingDate >= startDate && readingDate <= endDate;
    });
};

// Utility function to calculate cost
const calCost = (units: number, rate: number): number => {
    return units * rate;
};

// Route for getting top 3 providers
app.get('/users/:id/best-providers', authenticate, checkUser, (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);

    const user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).send('User not found');
    }

    const meter = meters.find(m => m.MeterId === user.MeterId);
    if (!meter) {
        return res.status(404).send('Meter not found');
    }

    const totalUnits = meter.readings.reduce((sum, reading) => sum + reading.units, 0);

    // const providerCosts = providers.map(provider => {
    //     const cost = calCost(totalUnits, provider.charge);
    //     return { provider, cost };
    // });

    const providerCosts = providers.map(provider => {
        let charge=provider.charge;
        return { provider,charge};
    });

    const topProviders = providerCosts
        .sort((a, b) => a.charge - b.charge)
        .slice(0, 3);

    res.send(topProviders);
});





app.listen(port, () => {
    console.log(`server is running on port http://localhost:${port}`)
})

// curl -X POST -H "Authorization: 100" -H "Content-Type: application/json" -d '{"username": "anoosha","password": "password3","email": "user3@example.com","fullname": "User Three"}' http://localhost:3000/users
// curl -X GET http://localhost:3000/users/1 -H "Authorization: 1"  
//curl -X GET http://localhost:3000/users -H "Authorization: 100"  
//curl -X PUT -H "Authorization: 100" -H "Content-Type: application/json" -d '{"username": "surya",  "password": "password3","email": "user3@example.com","fullname": "User Three"}' http://localhost:3000/users/1
//curl -X DELETE http://localhost:3000/users/1 -H "Authorization: 100"

//curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"username":"surya","password":"surya","email":"surya@gmail.com","fullname":"surya g"}'
//curl -X POST http://localhost:3000/providers -H "Content-Type: application/json" -d '{"name":"surya","charge":5}'
//curl -X GET 'http:/localhost:3000/providers' 
//curl -X PUT http://localhost:3000/providers/1 -H "Content-Type: application/json" -d '{"name":"tunnu","charge":3}'
//curl -X DELETE 'http:/localhost:3000/providers/1'


//curl -X POST -H "Authorization: 100" -H "Content-Type: application/json" -d '{"username": "HARI","password": "password3","email": "user3@example.com","fullname": "User Three"}' http://localhost:3000/users

//curl -X POST -H "Authorization: 100" -H "Content-Type: application/json" -d '{"username": "anoosha","password": "password3","email": "user3@example.com","fullname": "User Three"}' http://localhost:3000/users

//curl -X POST -H "Authorization: 100" -H "Content-Type: application/json" -d '{"username": "surya","password": "password3","email": "user3@example.com","fullname": "User Three"}' http://localhost:3000/users

//curl -X POST http://localhost:3000/providers -H "Content-Type: application/json" -d '{"name":"tunnu","charge":5}'

//curl -X POST http://localhost:3000/providers -H "Content-Type: application/json" -d '{"name":"junnu","charge":2}'

//curl -X POST http://localhost:3000/providers -H "Content-Type: application/json" -d '{"name":"punnu","charge":3}'

//curl -X POST http://localhost:3000/providers/subscribing/1 -H "Content-Type: application/json" -d '{"id":"1"}'

//curl -X POST http://localhost:3000/providers/subscribing/2 -H "Content-Type: application/json" -d '{"id":"1"}'

//curl -X POST http://localhost:3000/providers/subscribing/3 -H "Content-Type: application/json" -d '{"id":"3"}'

//curl -X POST http://localhost:3000/meters -H "Content-Type: application/json" -d '{"MeterId":1,"name":"elec"}'

//curl -X POST http://localhost:3000/meters -H "Content-Type: application/json" -d '{"MeterId":2,"name":"elec"}'

//curl -X POST http://localhost:3000/meters -H "Content-Type: application/json" -d '{"MeterId":3,"name":"magnet"}'

//curl -X PUT -H "Authorization: 100" -H "Content-Type: application/json" -d '{"meterId":1}' http://localhost:3000/users/1

//curl -X PUT -H "Authorization: 100" -H "Content-Type: application/json" -d '{"meterId":2}' http://localhost:3000/users/2

//curl -X PUT -H "Authorization: 100" -H "Content-Type: application/json" -d '{"meterId":2}' http://localhost:3000/users/3

//curl -X POST http://localhost:3000/meters/1/readings -H "Content-Type: application/json" -d '{"units":12,"date":"2024-06-01"}'


/*

curl -X POST http://localhost:3000/users -H "Authorization: 100" -H "Content-Type: application/json" -d '{"username": "hari","password": "password3","email": "user3@example.com","fullname": "User Three"}' 
curl -X POST http://localhost:3000/users -H "Authorization: 100" -H "Content-Type: application/json" -d '{"username": "anoosha","password": "password3","email": "user3@example.com","fullname": "User Three"}' 
curl -X POST http://localhost:3000/users -H "Authorization: 100" -H "Content-Type: application/json" -d '{"username": "surya","password": "password3","email": "user3@example.com","fullname": "User Three"}' 
POST http://localhost:3000/users -H "Authorization: 100" -H "Content-Type: application/json" -d '{"username": "monalisa","password": "password3","email": "user3@example.com","fullname": "User Three"}' 
curl -X POST http://localhost:3000/users -H "Authorization: 100" -H "Content-Type: application/json" -d '{"username": "goldie","password": "password3","email": "user3@example.com","fullname": "User Three"}' 
curl -X POST http://localhost:3000/users -H "Authorization: 100" -H "Content-Type: application/json" -d '{"username": "tunnu","password": "password3","email": "user3@example.com","fullname": "User Three"}' 


curl -X POST http://localhost:3000/providers -H "Content-Type: application/json" -d '{"name":"tunnu","charge":5}'
curl -X POST http://localhost:3000/providers -H "Content-Type: application/json" -d '{"name":"junnu","charge":2}'
curl -X POST http://localhost:3000/providers -H "Content-Type: application/json" -d '{"name":"punnu","charge":3}'
curl -X POST http://localhost:3000/providers -H "Content-Type: application/json" -d '{"name":"laddu","charge":5}'
curl -X POST http://localhost:3000/providers -H "Content-Type: application/json" -d '{"name":"leela","charge":2}'
curl -X POST http://localhost:3000/providers -H "Content-Type: application/json" -d '{"name":"seetha","charge":3}'

curl -X POST http://localhost:3000/providers/subscribing/1 -H "Authorization: 100" -H "Content-Type: application/json" -d '{"id":"1"}'
curl -X POST http://localhost:3000/providers/subscribing/2 -H "Authorization: 100" -H "Content-Type: application/json" -d '{"id":"1"}'
curl -X POST http://localhost:3000/providers/subscribing/3 -H "Authorization: 100" -H "Content-Type: application/json" -d '{"id":"3"}'

curl -X POST http://localhost:3000/meters -H "Content-Type: application/json" -d '{"MeterId":1,"name":"elec"}'
curl -X POST http://localhost:3000/meters -H "Content-Type: application/json" -d '{"MeterId":2,"name":"elec"}'
curl -X POST http://localhost:3000/meters -H "Content-Type: application/json" -d '{"MeterId":3,"name":"magnet"}'

curl -X PUT http://localhost:3000/users/1 -H "Authorization: 100" -H "Content-Type: application/json" -d '{"MeterId":1}' 
curl -X PUT http://localhost:3000/users/2 -H "Authorization: 100" -H "Content-Type: application/json" -d '{"MeterId”:2}’ 
curl -X PUT http://localhost:3000/users/3 -H "Authorization: 100" -H "Content-Type: application/json" -d '{"MeterId”:3}’ 


curl -X POST http://localhost:3000/meters/1/readings -H "Content-Type: application/json" -d '{"units":12,"date":"2024-06-20"}'

curl -X GET "http://localhost:3000/users/1/best-providers" -H "Authorization: 1" 

curl -X GET "http://localhost:3000/users/1/consumption?days=3" -H "Authorization: 1"

curl -X GET "http://localhost:3000/users?page=1&limit=5" -H "Authorization: 100”

curl -X GET "http://localhost:3000/users/1" -H "Authorization:1"

//curl -X POST http://localhost:3000/meters/1/readings -H "Content-Type: application/json" -d '{"units":12,"date":"2024-06-01"}'
curl -X POST http://localhost:3000/meters/1/readings -H "Content-Type: application/json" -d '{"units":12,"date":"2024-06-07"}'
*/