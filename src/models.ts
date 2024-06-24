// Create a user with attributes username, password, email and fullname
class User{
    id:number;
    username:string;
    password:string;
    email:string;
    fullname:string;
    MeterId?:number;
    provider?:number;
    constructor(id:number,username:string, password:string,email:string,fullname:string,MeterId?:number,provider?:number){
        this.id=id;
        this.username=username;
        this.password=password;
        this.email=email;
        this.fullname=fullname;
        this.MeterId=MeterId;
        this.provider=provider;
        
    }
}
class Providers{
    id:number;
    name:string;
    charge:number;
    constructor(id:number,name:string,charge:number){
        this.id=id;
        this.name=name;
        this.charge=charge;
    }
}
type Readings={
    units:number;
    date:string;
}
class Meters{
    MeterId:number;
    Name:string;
    readings:Readings[];
    constructor(MeterId:number,Name:string,readings:Readings[]){
        this.MeterId=MeterId;
        this.Name=Name;
        this.readings=readings;
    }
}

export {User,Providers,Meters,Readings};