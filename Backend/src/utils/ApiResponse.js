class apiresponse{
    constructor(status,message="success",data){
        this.status = status;
        this.message = message;
        this.data = data || null;
        this.success = status < 400; 
    }
}

export default apiresponse;