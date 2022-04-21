import { Socket } from "socket.io-client";

export class ChatManager {

    private socket: Socket;
    private messageCount = 0;
    private timeOut:NodeJS.Timeout | null = null;
    private input:HTMLInputElement;
    constructor(socket:Socket) {
        
        this.socket = socket;

        this.input = document.getElementById('chat_input') as HTMLInputElement; // get the input element
        // console.log(input)
        if (this.input!=null) {
            
            this.input.addEventListener('input',this.resizeInput ); // bind the "resizeInput" callback on "input" event
            this.resizeInput.call(this.input); // immediately call the function
            this.input.addEventListener('keyup',(e:KeyboardEvent)=>{this.chatEnter(this.socket,e,this.input)});   
        }
    }

    public focusInput(){
        console.log("focus")
        this.input.focus()
    }

    public newMessage(name:string,message:string){
      
        var div = document.getElementById('chat_items') as HTMLDivElement;
        div.style.display= 'grid';
        if(this.messageCount==4){
            div.removeChild(div.childNodes[0])
        }else{
            this.messageCount+=1;
        }
        var newChat = document.createElement('div');
        newChat.innerHTML = name + ":  "+message;
        newChat.className = "chat_item"
        div.appendChild(newChat)
        if(this.timeOut!=null){
            // clearTimeout(this.timeOut);
        }
        this.timeOut = setTimeout(()=>{
            div.removeChild(newChat)
            this.messageCount-=1;
            if(this.messageCount<0){
                this.messageCount =0;
            }
            // div.style.display= 'none';
        },20000)
    }

    private chatEnter(socket:Socket,e:KeyboardEvent,input:HTMLInputElement){
        if (e.key === 'Enter' ) {
            socket.emit("chat",input.value)
            input.value="";
            input.style.width = input.value.length + "ch";
        }
    }

    private resizeInput(this: HTMLInputElement) {
        this.style.width = this.value.length + "ch";
    }

}