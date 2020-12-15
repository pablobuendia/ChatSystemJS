const OK = "200";
const URL = 'http://localhost:8080';

function getTopicsListFromBroker() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.overrideMimeType("application/json");

    let idBroker = getElementById("idBroker");

    xmlHttp.onreadystatechange = function () {
        if (this.readyState == 4 && xmlHttp.status == OK) {
            let response = JSON.parse(xmlHttp.responseText);
            console.log('Respuesta del servidor: ', response);
            let topicsArray = response.resultados.listaTopicos;
            displayTopicsList('tablaTopicos',topicsArray);
        } else if (xmlHttp.status >= 400) {
            displayText("errorTopicos", "Error al obtener la lista de topicos:" + xmlHttp.response + ". Status: " + xmlHttp.status + ". Readystate: " + this.readyState);
        }
    }
    
    xmlHttp.open("GET", `${URL}/broker/${idBroker}/topics`, true);
    xmlHttp.send();
}

function deleteTopic() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.overrideMimeType("application/json");

    let topicToDelete = getElementById("borrarTopico");
    let idBroker = getElementById("idBrokerDelete");
    
    xmlHttp.onreadystatechange = function() {
        if (this.readyState == 4 && xmlHttp.status == OK) {
            displayText("mensajeBorrado", "Topico borrado correctamente");
        } else if (xmlHttp.status >= 400) {
            displayText("mensajeBorrado", "Error al borrar el topico: " + topicToDelete + ". Response: " + xmlHttp.response + ". Status: " + xmlHttp.status + ". Readystate: " + this.readyState);
        } 
    }
    xmlHttp.open("DELETE", `${URL}/broker/${idBroker}/topics/${topicToDelete}`, true);
    xmlHttp.send();
}

function getMessageListFromTopic() {
    var xmlHttp = new XMLHttpRequest();
    let topico = getElementById("solicitarTopico");
    let idBroker = getElementById("idBrokerTopico");
    xmlHttp.onreadystatechange = function() { 
        if (this.readyState == 4 && xmlHttp.status == OK) {
            let messagesArray = JSON.parse(xmlHttp.responseText).resultados.mensajes.mensajes;
            displayMessagesList("tablaMensajes", messagesArray);
        } 
        else if (xmlHttp.status >= 400) {
            displayText("errorMensajes", "Error al obtener los mensajes del topico " + topico);
        }  
    }
    xmlHttp.open("GET", `${URL}/broker/${idBroker}/topics/${topico}`, true);
    xmlHttp.send();
}

function getElementById(id) {
    return document.getElementById(id).value;
}

/**
 * Ingresa el texto dentro del div
 * @param {String} idDiv el id del div
 * @param {String[]} text El texto a ingresar
 */
function displayText(idDiv, text) {
    var divElement = document.getElementById(idDiv);
    divElement.innerHTML = text;
}

/**
 * Ingresa el array de elementos en la tabla
 * @param {String} idTabla el id de la tabla en donde insertar el array
 * @param {String[]} elements La lista de mensajes a ingresar
 */
function displayTopicsList(idTabla, elements) {
    var tbodyRef = document.getElementById(idTabla).getElementsByTagName('tbody')[0];
    tbodyRef.innerHTML = "";
    for(i = 0; i < elements.length; i++) {
        var newRow = tbodyRef.insertRow();
        var newCell = newRow.insertCell();
        var newText = document.createTextNode(elements[i]);
        newCell.appendChild(newText);
    }
}

/**
 * Ingresa el array de elementos en la tabla
 * @param {String} idTabla el id de la tabla en donde insertar el array
 * @param {String[]} elements La lista de mensajes a ingresar
 */
function displayMessagesList(idTabla, elements) {
    var tbodyRef = document.getElementById(idTabla).getElementsByTagName('tbody')[0];
    tbodyRef.innerHTML = "";
    for(i = 0; i < elements.length; i++) {
        var newRow = tbodyRef.insertRow();
        var newCell = newRow.insertCell();
        var mensaje = JSON.parse(elements[i].mensaje);
        var newText = document.createTextNode("Emisor: " + mensaje.emisor + ". Mensaje: " + mensaje.mensaje + ". Fecha: " + mensaje.fecha);
        newCell.appendChild(newText);
    }
}