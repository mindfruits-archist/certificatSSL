const sslCertificate = require('get-ssl-certificate')
const download = require('download')
const fs = require('fs');
const http = require('http');
const https = require('https');
const url = require('url');
const { spawn, exec } = require('child_process');
const csv = require('csvtojson')
const sendmail = require('sendmail')({  silent: true });

//TELECHARGER LA LISTE DES CLIENT MINDFRUITS A PARTIR D'UNE FEUILLE GOOGLESHEETS
download('https://docs.google.com/spreadsheets/d/1BXXPAHb6qlyKj_zUyhtZAaVuUppI8nffxB9E5OW0Iss/gviz/tq?tqx=out:csv&sheet=global', 'dist').then((data) => {
  let d = new Date()
  d = d.getFullYear()+"-"+d.getMonth()+"-"+d.getDate()+"--"+d.getHours()+"-"+d.getMinutes()+"-"+d.getSeconds()
  const csvFilePath='dist/foo'+d+".csv"
  fs.writeFileSync(csvFilePath, data);
  csv().fromFile(csvFilePath).then((jsonObj)=>{
    check_ssl(jsonObj)
                                                                                console.log('extraction done!');
  })
});

function check_ssl(csvArray){
                                                                                console.log(csvArray[0]['Management URL'])
  var instructions = "Pour récupérer la liste des URLs des clients Mindfruits,\n aller à l'url suivante: https://docs.google.com/spreadsheets/d/1fGeceHZvKXRxLq1qu2-QWUIZxkMwLub-mZOQNMxgOio/edit#gid=836304774\nOuvrir l'éditeur de script, lancer la myFunction(), afficher les logs et y récupérer la liste des urls sous forme d'un array.\nPar contre, le array récupéré ne sera pas dans le bon format, il faudra reformater le array récupéré via ce log de myFunction():\n- supprimer les 'http://''\n- supprimer les '/' à la fin des urls\n- (et p^t autre chose)<br>csvArray.length: "+csvArray.length
//soon = 15JOURS, PERMET DE RAPIDEMENT SAVOIR SI UN CERTIFICAT SSL VA BIENTOT(sous 15j) EXPIRER
  const _soon = 15
  const soon = _soon * ((60*60*24) * 1000)
                                                                                //console.log("soon");
                                                                                //console.log(soon);
//INTIALISATION DES VARIABLES NECESSAIRES AFIN LANCER LE PROCESS DE VERIFICATION
  const today = new Date()
  const todayTIME = today.getTime()
  let invalidSoon = todayTIME + soon
  let listeClientNonValides = []
  let listeClientNonValides_ = []
  let listeClientBientotNonValides = []
  let listeClientBientotNonValides_ = []
  let done = 0
  let key = 0
//ON LANCE UNE PROMESSE CAR LA FONCTION DE RECUPERATION DES CERTIFACAT SSL EST ASYNCHRONE
  new Promise((res, rej) => {
    var tmp = setTimeout(function(){res(true)}, 10000)
    var messageFinal = ""
    var messageErrors = ""
    for(el of csvArray){
//ON REMPLACE TOUS LES ELEMENT DE L'URL QUI PRODUISENT UN BUG DANS LA FONCTION sslCertificate.get
        sslCertificate.get(el['Management URL'].replace('https://', '').replace(".fr/", ".fr").replace(".com/", ".com").replace(".net/", ".net").replace(".eu/", ".eu").replace(".biz/", ".biz")).then(function (certificate) {
                                                                                //console.log(certificate);
//LA SEULE VALEUR QUI NOUS INTERESSE ICI EST LA DATE D'EXPIRATION
//DONC ON LA RECUPERE SOUS 2 FORME: {obejct Date(expiringDate), Timestamp(expiringDateTIME)}
          let expiringDate = new Date(certificate.valid_to)
          let expiringDateTIME = expiringDate.getTime();                        //console.log("invalidSoon: "+invalidSoon+"|||expiringDate: "+expiringDateTIME);

//ESTCEQUE LA DATE D'EXPIRATION DU CERTIFICAT EST DEJA EXPIREE ?
          let valid = todayTIME < expiringDateTIME;                             //console.log(todayTIME - expiringDateTIME);
          if(!valid){
            listeClientNonValides.push(el)
            listeClientNonValides_.push(expiringDate.getDate()+"/"+expiringDate.getMonth()+"/"+expiringDate.getFullYear())
          }

//ESTCEQUE LA DATE D'EXPIRATION DU CERTIFICAT VA EXPIRER SOUS 15(soon) JOURS ?
          invalidSoon = invalidSoon > expiringDateTIME
  //SI OUI, ON RAJOUTE LA LIGNE DANS L'ARRAY listeClientBientotNonValides
          if(invalidSoon){
            listeClientBientotNonValides.push([el, "expire le: "+expiringDate.getDate()+"/"+expiringDate.getMonth()+"/"+expiringDate.getFullYear()])
            listeClientBientotNonValides_.push(expiringDate.getDate()+"/"+expiringDate.getMonth()+"/"+expiringDate.getFullYear())
          }

          messageFinal += key+"  client: "+el["Management URL"]+"; Toujours valide: "+ valid+"; Certificat SSL bientôt invalide (dans "+_soon+"jours)?: "+invalidSoon
//AFIN QUE LA FONCTION ASYNCHRONE NE resolve LA PROMESSE QU'A LA FIN DE LA BOUCLE
          if(++done == csvArray.length)
            res(true)

          key++;
          /*
                                                                                console.log(["key: "+key, "done: "+done, "csvArray.length: "+csvArray.length]);
          */
        }).catch((err)=>{
          if(++done == csvArray.length-1)res(true)
          messageErrors = "key: "+key, "done: "+done+"\n"
        })
    }
    console.log(messageFinal);
  }).then((val)=>{
    /*
                                                                                console.log("\n\n\nVoici la liste des ("+listeClientNonValides.length+") clients qui s'affichent avec une erreur SSL:");
                                                                                console.log(listeClientNonValides);
                                                                                console.log("Et Voici la liste des "+listeClientBientotNonValides.length+" clients avec un certificat SSL bientot expiré (dans "+soon+" jours):");
                                                                                console.log(listeClientBientotNonValides);
                                                                                console.log("\nSur "+csvArray.length+" clients:\n"+listeClientNonValides.length+" sont invalides,\n"+listeClientBientotNonValides.length+" sont bientôt invalides.\n\n\n");
    */
    var liste_sites = ""
    var liste_nonValid_sites = ""
    var tab=tab_="<table border='1' style='width:100%'><tr><th style='width:30%'>Adresse</th><th style='width:30%'>Manager</th><th style='width:30%'>expire le</th></tr>"
    for(a in listeClientNonValides)tab += "<tr><td>"+listeClientNonValides[a]["Management URL"]+"</td><td>"+listeClientNonValides[a]["Manager"]+"</td><td>"+listeClientNonValides_[a]+"</td></tr>"
    tab += "</table>"
    for(a in listeClientBientotNonValides)"<tr><td>"+listeClientBientotNonValides[a]["Management URL"]+"</td><td>"+listeClientBientotNonValides[a]["Manager"]+"</td><td>"+listeClientBientotNonValides_[a]+"</td></tr>"
    tab_ += "</table>"
    let tmpEmail = "Sur "+csvArray.length+" clients:\n"+listeClientNonValides.length+" sont invalides,\n"+listeClientBientotNonValides.length+" sont bientôt invalides.<br><br>Voici la liste des clients("+listeClientNonValides.length+") qui s'affichent avec <span style='color:orange'>une erreur SSL</span>:<br>"+tab+"<br>Et Voilà la liste des clients("+listeClientBientotNonValides.length+") <span style='color:orange'>avec un certificat SSL bientot expiré</span> (dans "+_soon+" jours):<br>"+tab_
    //let emails = ["guillaume.eouzan@mindfruits.biz", "claire.moquet@mindfruits.biz", "maeva@mindfruits.biz", "kevin@mindfruits.biz", "arnaud@mindfruits.biz", "florent@mindfruits.biz", "christophe@mindfruits.biz", "christine@mindfruits.biz", "melody@mindfruits.biz", "gaelle@mindfruits.biz", "cyrille@mindfruits.biz"]
    //emails = emails.join(", ")
    // console.log(emails+"\n\n\n\n\n");
    // console.log(tmpEmail.replace(/<br>/g, "\n")+"\n\n\n\n\n");
    sendmail({
       from: "cyrille.mindfruits@gmail.com",
       to: "hi.cyril@gmail.com, cyrille.mindfruits@gmail.com",
       //to: "multicomptes.mindfruits@gmail.com",
       subject: 'Teste certification SSL clients: ' + (+new Date()),
       html: getHtml(tmpEmail)
     }, function(err, reply) {
       if(err)console.log("erreurs envoie email");
       else{
         console.log("Email envoyé: %s", reply);
         //launchHTML(instructions+"<br><br>"+tmpEmail)
       }
    });
    return console.log("FIN");
  }).catch((err)=>console.log("erreur Promise: %s", err))
}

function getHtml(content){
  let html = fs.readFileSync(__dirname + '/final.html', 'utf8');
  html = html.replace("{{content}}", content)
  return html
}
function launchHTML(valid = false){
  http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.write(html);
    res.end();
  }).listen(8080);
}
