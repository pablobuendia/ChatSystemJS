const OK = "200";

// PONER URL REAL
const topicsListUrl = 'http://localhost:8080';

function displayTopicsList(topics) {
    var topicosElement = document.getElementById("topicos");
    topicosElement.innerHTML = "";

    for(i = 0; i < topics.length; i++) {
        var li = document.createElement("LI");
        li.innerHTML = topics[i];
        topicosElement.appendChild(li);
    }
}

function getTopicsList() {
    var xmlHttp = new XMLHttpRequest();
    let idBroker = document.getElementById("idBroker").value;
    xmlHttp.onreadystatechange = function() { 
        if (this.readyState == 4 && xmlHttp.status == OK) {
            let topicsArray = JSON.parse(xmlHttp.responseText);
            displayTopicsList(topicsArray);
        } 
        else {
            alert("Error al obtener la lista de topicos");
        }  
    }
    xmlHttp.open("GET", `http://localhost:8080/broker/${idBroker}/topics`, true); // true for asynchronous 
    xmlHttp.send();
}

function deleteTopic() {
    let topicToDelete = document.getElementById("borrarTopico").value;
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (this.readyState == 4 && xmlHttp.status == OK) {
            alert("Topico borrado correctamente");
        } 
        else {
            alert("Error al borrar el topico "+ topicToDelete);
        } 
    }
    // DEBERIAMOS MANDAR EL TOPICTODELETE COMO PARAMETRO DE LA REQUEST
    const json = {
        "topic": topicToDelete
    };
    xmlHttp.open("DELETE", topicsListUrl, true);
    xmlHttp.setRequestHeader('Content-Type', 'application/json');
    xmlHttp.send(JSON.stringify(json));
}