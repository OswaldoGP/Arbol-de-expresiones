class Persona{
    // el # es para ocultar 
    // metodo principal 
    #valorPrivado = "secreto";
    #nombre;
    constructor(nombre)
        this.#nombre = nombre,
        this.#valorPrivado = "otro dato"    
    }

    mostrarDatos(){
        let saludo = "hola";
        console.log('
            Nombre: ${this.#nombre}    
            ${saludo}
        ');
    }
    #editarNombre(nombre){
        this.#nombre = nombre;
    }
    validarNombre(nombre){
        if(nombre != ""){
            this.#editarNombre(nombre);
        }else{
            console.log("debes ingresar un nombre");
            
        }
    }
    
    getNombre(){
        return this.#valorPrivado;
    }
    getValorPrivado(){
        return this.#valorPrivado
    }

    setNombre(nombre){
        this.#nombre = nombre;
    }

    setValorPrivado(valor){
        this.valorPrivado = valor;
    }

}


export default Persona;

