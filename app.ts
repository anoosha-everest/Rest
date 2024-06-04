import express, {Request,Response} from "express";
import {User} from "./models";
import bodyParser from 'body-parser';


const app = express()

app.use(bodyParser.json());
const port = 3000

const users:User[] = [];
const providers=[] as any;
const meters=[] as any;

app.get('/', (req:Request, res:Response) => {
  res.send('Hello World!')
})
app.get ('/status',(req:Request, res:Response) => {
    const status={
        status:"up and running"
    }
    res.send(status);
  })
app.get('/users',(req:Request,res:Response)=>{
    res.send(users); 
  })
  app.get('/users/:id',(req:Request,res:Response)=>{
     const id=req.params.id;
     const user=users.find((item:any)=> item.id==id);
     console.log("id",id);
     console.log('user',user); 
    res.send(user); 
  })
  app.put('/users/:id', (req:Request, res:Response) => {
    const id = parseInt(req.params.id);
    const newName = req.body.name;
    console.log(newName);
    let userIndex = users.findIndex((user:any) => user.id === id);
    userIndex=userIndex+1;
    console.log(userIndex);
    if (userIndex === -1) {
        res.send("User not found" );
        return;
    }
    users[userIndex].name = newName;
    res.json(users[userIndex]);
});
app.delete('/users/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const userIndex = users.findIndex((user:any) => user.id === id);
    if (userIndex === -1) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    const deletedUser = users.splice(userIndex, 1);
    res.json({ message: "User deleted successfully", deletedUser });
});

app.post('/users', (req: Request, res: Response) => {
    let name: string = req.body.name;
    let user:User = new User(users.length + 1, name);
    users.push(user);
    res.send("User created");
});

app.post('/status',(req:Request, res:Response) => {
    const status={
        status:"up and running"
    }
    res.send(status);
  })
 
const router=express.Router()

// router.get('/')
// router.get('/:id')

// app.use('/users',router); 

app.get('/users');
app.post('/users');
app.get('/users/:id');
app.put ('/users/:id');

app.put ('/providers/:id');

app.get('/getAllProviders',(req:Request,res:Response)=>{
    res.send(providers); 
  })
app.post('/meters',(req:Request,res:Response)=>{
    console.log("uesrname",req.query.username);
    const user={
        id:users.length+1,
        name:req.query.username
    }
    users.push(user);
    res.send("user created")
  })
app.post('/updateProvider/:id', (req:Request, res:Response) => {
    const id = parseInt(req.params.id);
    let providerIndex:number = providers.findIndex((provider:any) => provider.id == id);
    
    providerIndex=providerIndex+1; 
    console.log(providerIndex)
    if (providerIndex === -1) {
        res.send('Provider not found');
    } else {
        const name = req.body && req.body.name; // Check if req.body is defined
        console.log(name);
        const charge = req.body && req.body.charge; // Check if req.body is defined
        console.log(charge)
        if (name) providers[providerIndex].name = name;
        if (charge) providers[providerIndex].charge = charge;
        res.send('Provider updated successfully');
    }
});
app.post('/createProviders',(req:Request,res:Response)=>{
    console.log("uesrname",req.query.username);
    console.log("charge",req.query.charge);
    // const newProvider = req.body;
    // newProvider.id = providers.length + 1;
    // providers.push(newProvider);
    const provider={
        id:providers.length+1,
        name:req.query.username,
        charge: req.query.charge
    }
    providers.push(provider);
    res.send("provider created")
  })
  app.delete('/deleteProvider/:id', (req:Request, res:Response) => {
    const id = parseInt(req.params.id);
    const index = providers.findIndex((provider:any) => provider.id === id);
    if (index === -1) {
        res.send('Provider not found');
    } else {
        providers.splice(index, 1);
        res.send('Provider deleted successfully');
    }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})