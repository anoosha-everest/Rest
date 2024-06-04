import express, { Request, Response } from "express";
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

app.get('/', (req:Request, res:Response) => {
    res.send('Hello World!')
  })
// Return all users
app.get('/users', (req, res) => {
    res.send(users); 
});

// Create a user with attributes username, password, email and fullname
app.post('/users', (req, res) => {
    let user:User = new User(users.length + 1, req.body.username,req.body.password,req.body.email,req.body.fullname);
    users.push(user);
    res.send("User created");
    
});

// Return a user with parameter id if not exists return message saying `user not found`
app.get('/users/:id', (req, res) => {
    const id=parseInt(req.params.id);
     const user=users.find(item=> item.id==id);
     if(user){
        res.send(user); 
     }
     else{
        res.send("user not found");
     }
     console.log("id",id);
     console.log('user',user); 
    
});


// update user information for given id 
app.put('/users/:id', (req, res) => {
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
app.delete('/users/:id', (req, res) => {
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
app.post('/providers/subscribing/:id',(req,res)=>{
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
app.put('/users/:id', (req, res) => {
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
app.post('/meters', (req, res) => {
    let meter:Meters = new Meters(req.body.MeterId, req.body.name,[]);
    meters.push(meter);
    res.send("meter created");
    
});
//create readings for a given meter id
app.post('/meters/:id/readings', (req, res) => {
    let meter_id=parseInt(req.params.id);
    let units=req.body.units;
    let date=req.body.time;
    let read:Readings={
        units:units,
        time:date
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
app.get('/meters/:id',(req,res)=>{
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
app.get('/users/bill/:id',(req,res)=>{
    let user_id=parseInt(req.params.id);
    console.log(user_id);
    let user=users.find(item=>item.id===user_id);
    if(user){
        let prov_id=(user.provider!=undefined?user.provider:-1);
        let meterId=user.MeterId;
        let meter=meters.find(item=>item.MeterId===meterId);
        if(meter){
            let read=meter.readings;
            let units=read.reduce((sum,item)=>sum+item.units,0);
            if(prov_id){
                let pro=providers.find(item=>item.id===prov_id);
                if(pro){
                    let charge=pro.charge;
                    let amt=charge*units;
                    console.log(amt);
                    let bill={
                        user_id:user_id,
                        amount:amt
                    }
                    res.send(bill);
                }
                else{
                    console.log("hajahgjs");
                }
            }
            else{
                res.send("provider doesn't exist");
            }
        }
    }
    else{
        res.send("user doesnt exist with that id");
    }
    
});

app.listen(port, () => {
    console.log(`server is running on port http://localhost:${port}`)
})

//curl -X POST http://localhost:3000/providers -H "Content-Type: application/json" -d '{"name":"surya","charge":5}'
//curl -X GET 'http:/localhost:3000/providers' 
//curl -X PUT http://localhost:3000/providers/1 -H "Content-Type: application/json" -d '{"name":"tunnu","charge":3}'
//curl -X DELETE 'http:/localhost:3000/providers/1'