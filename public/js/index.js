const expresion = document.getElementById("expresion");
const arbol = document.getElementById("arbol");

let contador = 0;
let lineas = [];

// =====================================================
// TOKENIZADOR
// =====================================================

const tokenizar = (texto) => {
    const tokens = [];
    let i = 0;

    while (i < texto.length) {
        const caracter = texto[i];

        // Ignorar espacios
        if (/\s/.test(caracter)) {
            i++;
            continue;
        }

        // Números enteros y decimales
        if (/[0-9.]/.test(caracter)) {
            let numero = "";

            while (
                i < texto.length &&
                /[0-9.]/.test(texto[i])
            ) {
                numero += texto[i];
                i++;
            }

            // Validar que no haya más de un punto
            if ((numero.match(/\./g) || []).length > 1) {
                throw new Error(`Número inválido: ${numero}`);
            }

            tokens.push({
                tipo: "numero",
                valor: numero
            });

            continue;
        }

        // Variables / identificadores
        if (/[A-Za-z_]/.test(caracter)) {
            let nombre = "";

            while (
                i < texto.length &&
                /[A-Za-z0-9_]/.test(texto[i])
            ) {
                nombre += texto[i];
                i++;
            }

            tokens.push({
                tipo: "variable",
                valor: nombre
            });

            continue;
        }

        // Operadores
        if ("+-*/^".includes(caracter)) {
            tokens.push({
                tipo: "operador",
                valor: caracter
            });

            i++;
            continue;
        }

        // Paréntesis
        if (caracter === "(" || caracter === ")") {
            tokens.push({
                tipo: "parentesis",
                valor: caracter
            });

            i++;
            continue;
        }

        throw new Error(`Carácter no reconocido: ${caracter}`);
    }

    return tokens;
};


// =====================================================
// PARSER
// =====================================================

const Parser = class {
    constructor(tokens) {
        this.tokens = tokens;
        this.posicion = 0;
    }

    actual() {
        return this.tokens[this.posicion];
    }

    consumir() {
        return this.tokens[this.posicion++];
    }

    coincidir(valor) {
        if (
            this.actual() &&
            this.actual().valor === valor
        ) {
            this.posicion++;
            return true;
        }

        return false;
    }

    // -------------------------------------------------
    // EXPRESIÓN (+ y -)
    // -------------------------------------------------

    parseExpresion() {
        let nodo = this.parseTermino();

        while (
            this.actual() &&
            (this.actual().valor === "+" ||
             this.actual().valor === "-")
        ) {
            const operador = this.consumir().valor;
            const derecha = this.parseTermino();

            nodo = {
                valor: operador,
                izquierda: nodo,
                derecha: derecha
            };
        }

        return nodo;
    }

    // -------------------------------------------------
    // TÉRMINO (* y /)
    // -------------------------------------------------

    parseTermino() {
        let nodo = this.parsePotencia();

        while (
            this.actual() &&
            (this.actual().valor === "*" ||
             this.actual().valor === "/")
        ) {
            const operador = this.consumir().valor;
            const derecha = this.parsePotencia();

            nodo = {
                valor: operador,
                izquierda: nodo,
                derecha: derecha
            };
        }

        // Multiplicación implícita
        while (this.actual() && this.iniciaFactor()) {
            const derecha = this.parsePotencia();

            nodo = {
                valor: "*",
                izquierda: nodo,
                derecha: derecha
            };
        }

        return nodo;
    }

    // -------------------------------------------------
    // POTENCIA (^)
    // -------------------------------------------------

    parsePotencia() {
        let nodo = this.parseUnario();

        if (
            this.actual() &&
            this.actual().valor === "^"
        ) {
            this.consumir();

            const derecha = this.parsePotencia();

            nodo = {
                valor: "^",
                izquierda: nodo,
                derecha: derecha
            };
        }

        return nodo;
    }

    // -------------------------------------------------
    // UNARIOS (+x, -x)
    // -------------------------------------------------

    parseUnario() {
        if (this.coincidir("+")) {
            return this.parseUnario();
        }

        if (this.coincidir("-")) {
            return {
                valor: "−",
                izquierda: null,
                derecha: this.parseUnario(),
                unario: true
            };
        }

        return this.parseFactor();
    }

    // -------------------------------------------------
    // FACTOR
    // -------------------------------------------------

    parseFactor() {
        const token = this.actual();

        if (!token) {
            throw new Error("Expresión incompleta");
        }

        // Paréntesis
        if (this.coincidir("(")) {
            const nodo = this.parseExpresion();

            if (!this.coincidir(")")) {
                throw new Error("Falta cerrar un paréntesis");
            }

            return nodo;
        }

        // Número o variable
        if (
            token.tipo === "numero" ||
            token.tipo === "variable"
        ) {
            this.consumir();

            return {
                valor: token.valor,
                izquierda: null,
                derecha: null
            };
        }

        throw new Error(
            `Token inesperado: ${token.valor}`
        );
    }

    iniciaFactor() {
        const token = this.actual();

        if (!token) {
            return false;
        }

        return (
            token.tipo === "numero" ||
            token.tipo === "variable" ||
            token.valor === "("
        );
    }

    analizar() {
        const resultado = this.parseExpresion();

        if (this.actual()) {
            throw new Error(
                `Expresión inválida cerca de: ${this.actual().valor}`
            );
        }

        return resultado;
    }
};


// =====================================================
// CREAR ÁRBOL
// =====================================================

const crearArbol = (texto = "") => {
    texto = texto.trim();

    if (!texto) {
        return null;
    }

    const tokens = tokenizar(texto);

    if (tokens.length === 0) {
        return null;
    }

    const parser = new Parser(tokens);

    return parser.analizar();
};


// =====================================================
// DIBUJAR NODOS
// =====================================================

const dibujarNodo = (nodo, raiz = false) => {
    if (!nodo) {
        return "";
    }

    contador++;

    const id = `nodo${contador}`;

    nodo.id = id;

    const operadores = "+-*/^−";

    let color = "bg-success";

    if (operadores.includes(nodo.valor)) {
        color = raiz
            ? "bg-primary"
            : "bg-warning";
    }

    const contenido = `
        <div class="nodo-contenedor text-center">

            <p
                id="${id}"
                class="${color} rounded-circle py-4 text-white fw-bold nodo"
                style="width:70px; margin:auto;"
            >
                ${nodo.valor}
            </p>

            <div class="row justify-content-around hijos">
                ${
                    nodo.izquierda
                        ? `
                            <div class="col-5">
                                ${dibujarNodo(nodo.izquierda)}
                            </div>
                          `
                        : ""
                }

                ${
                    nodo.derecha
                        ? `
                            <div class="col-5">
                                ${dibujarNodo(nodo.derecha)}
                            </div>
                          `
                        : ""
                }
            </div>

        </div>
    `;

    return contenido;
};


// =====================================================
// CONECTAR NODOS
// =====================================================

const conectar = (nodo) => {
    if (!nodo) {
        return;
    }

    const hijos = [
        nodo.izquierda,
        nodo.derecha
    ];

    hijos.forEach((hijo) => {
        if (!hijo) {
            return;
        }

        const origen = document.getElementById(nodo.id);
        const destino = document.getElementById(hijo.id);

        if (!origen || !destino) {
            return;
        }

        const linea = new LeaderLine(
            origen,
            destino,
            {
                startPlug: "disc",
                endPlug: "disc",
                color: "#8b772c",
                size: 4
            }
        );

        lineas.push(linea);

        conectar(hijo);
    });
};


// =====================================================
// BORRAR LÍNEAS ANTERIORES
// =====================================================

const limpiarLineas = () => {
    lineas.forEach((linea) => {
        linea.remove();
    });

    lineas = [];
};


// =====================================================
// DIBUJAR ÁRBOL
// =====================================================

const dibujar_arbol = (expresionInput = "") => {

    limpiarLineas();

    arbol.innerHTML = "";

    contador = 0;

    if (!expresionInput.trim()) {
        return;
    }

    try {

        const raiz = crearArbol(expresionInput);

        arbol.innerHTML = dibujarNodo(
            raiz,
            true
        );

        setTimeout(() => {
            conectar(raiz);
        }, 100);

    } catch (error) {

        arbol.innerHTML = `
            <div class="alert alert-danger mt-4">
                <strong>Error:</strong>
                ${error.message}
            </div>
        `;
    }
};


// =====================================================
// EVENTO
// =====================================================

expresion.addEventListener(
    "input",
    (event) => {
        dibujar_arbol(
            event.currentTarget.value
        );
    }
);