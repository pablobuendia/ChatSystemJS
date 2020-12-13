const OK = "200";

const URL = 'http://localhost:8080';

function displayTopicsList(topics) {
    console.log("Aqui van", topics);
    var topicosElement = document.getElementById("topicosList");
    topicosElement.innerHTML = "";

    for(i = 0; i < topics.length; i++) {
        var li = document.createElement("LI");
        li.innerHTML = topics[i];
        topicosElement.appendChild(li);
    }
}

function getTopicsListFromBroker() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.overrideMimeType("application/json");
    let idBroker = getElementById("idBroker");
    xmlHttp.open("GET", `${URL}/broker/${idBroker}/topics`, true);
    xmlHttp.onload = function() {
        let asd = new Object();
        asd.pepe = "amiguito";
        console.log(asd);

        let response = JSON.parse(xmlHttp.responseText);
        console.log('Respuesta', response);
        console.log('respuesta', response.accion);
    }

    /*xmlHttp.onreadystatechange = function() { 
        if (this.readyState == 4 && xmlHttp.status == OK) {
            let response = JSON.parse(xmlHttp.responseText);
            console.log('Respuesta', response);
            console.log('respuesta', response.exito);
            let topicsArray = response[0].resultados.listaTopicos;
            displayTopicsList(topicsArray);
        } 
        else {
            alert("Error al obtener la lista de topicos");
        }  
    }*/
    
    xmlHttp.send();
}

function deleteTopic() {
    let topicToDelete = getElementById("borrarTopico");
    let idBroker = getElementById("idBrokerDelete");
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (this.readyState == 4 && xmlHttp.status == OK) {
            alert("Topico borrado correctamente");
        } 
        else {
            alert("Error al borrar el topico "+ topicToDelete);
        } 
    }
    xmlHttp.open("DELETE", `${URL}/broker/${idBroker}/topics/${topicToDelete}`, true);
    xmlHttp.send();
}

function displayMessagesFromTopic(messages) {
    console.log(messages);
}

function getMessageListFromTopic() {
    var xmlHttp = new XMLHttpRequest();
    let topico = getElementById("solicitarTopico");
    let idBroker = getElementById("idBrokerTopico");
    xmlHttp.onreadystatechange = function() { 
        if (this.readyState == 4 && xmlHttp.status == OK) {
            let messagesArray = JSON.parse(xmlHttp.responseText);
            displayMessagesFromTopic(messagesArray);
        } 
        else {
            alert("Error al obtener los mensajes del topico "+ topico);
        }  
    }
    xmlHttp.open("GET", `${URL}/broker/${idBroker}/topics/${topico}`, true);
    xmlHttp.send();
}

function getElementById(id) {
    return document.getElementById(id).value;
}